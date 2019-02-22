var request = require('request-promise-native');

var AssistantKodi = function(configuration) {
  if (configuration.hosts) {
    this.hosts = configuration.hosts
  // legacy conf
  } else {
    this.host = configuration.host
    this.port = configuration.port | 8080
    this.reconnect = configuration.reconnect | false
    this.reconnectSleep = configuration.reconnectSleep | 3000
    this.connectionTimeout = configuration.connectionTimeout | 10000
    this.sendTimeout = configuration.sendTimeout | 3000
  }

  this.hostConf = null

}

AssistantKodi.prototype.init = function(plugins) {

  var _this = this
  this.plugins = plugins

  if (!this.hosts && !this.host) Promise.reject("[assistant-kodi] Erreur : vous devez configurer ce plugin !")

  return Promise.resolve(this)

};

/**
 * Fonction appelée par le système central
 *
 * @param {String} commande Le nom du event WebHook créé sur IFTTT
 * @param {Object} [params] Peut contenir 'value1', 'value2' et 'value3'
 *
 */
AssistantKodi.prototype.action = function(commande, params) {
  var method = commande,
      params = null,
      hostConf = null

  // on cherche un hôte configuré pour le multi-hosts
  if ( method.indexOf('~') > -1)  {
    // commande reçue : sejour~Input.Home
    var arrHost = method.split('~')
    method = arrHost[1]
    hostId = arrHost[0]

    if ( this.hosts[hostId] )
      hostConf = this.hosts[hostId].host + ":" + this.hosts[hostId].port

    else if ( this.hosts[Object.keys(this.hosts)[0]] )
      hostConf = this.hosts[Object.keys(this.hosts)[0]].host + ":" + this.hosts[Object.keys(this.hosts)[0]].port

    // legacy conf
    else if (this.host)
      hostConf = this.host + ":" + this.port

    else {
      console.log ('Aucun hôte correspondant n\'a été trouvé')
      return false;
    }

  }
  else {
    if ( this.hosts[Object.keys(this.hosts)[0]] )
      hostConf = this.hosts[Object.keys(this.hosts)[0]].host + ":" + this.hosts[Object.keys(this.hosts)[0]].port
    // legacy conf
    else if (this.host)
      hostConf = this.host + ":" + this.port
  }

  AssistantKodi.hostConf = hostConf

  // Manage search&play feature
  if ( method.indexOf('sandp') === -1 ) {
    // si '#' dans la commande, on recupère l'objet
    if ( method.indexOf('#') > -1) {
      var arrParams = method.split('#')
      method = arrParams[0]
      params = JSON.parse(arrParams[1])
      var body = {
        jsonrpc: "2.0",
        id: 1,
        method: method,
        params: params
      }

    } else {
      var body = {
        jsonrpc: "2.0",
        id: 1,
        method: method
      }

    }

    var req = {
      url: 'http://' + hostConf + "/jsonrpc",
      headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'assistant-plugin'
      },
      method: 'POST',
      body: body,
      json: true
    }

    request(req)
    .then(function(response){
      //console.log(response.result)
      return (response)
    })
    .catch(function(err){
      console.log(err)
      return (err)
    })

  }

  // Ths is a search request
  else {
    if ( method.indexOf('#') === -1 ) {
      console.log("no parameters found for search")
      return false
    }

    var arrParams = method.split('#')
    if ( arrParams.length < 3) {
      console.log("missing parameters for search : sandp#Title#tvshow")
      return false
    }

     // method = arrParams[0] // always sandp
    var title = arrParams[1]
    var library = arrParams[2]
    var inProgress = Boolean(arrParams[3])
    AssistantKodi.search ( title, library, inProgress )
  }

};

AssistantKodi.search = (title, library, inProgress) => {

  switch (library) {
    case 'movie' :
      var method = "VideoLibrary.GetMovies"
      var id = "libMovies"
      var filter = { operator: "contains", field: "title", value: title }
      break
    default :
      var method = inProgress ? "VideoLibrary.GetInProgressTVShows" :"VideoLibrary.GetTVShows"
      var id = "libTvShows"
      var filter = { and: [ {operator: "contains", field: "title", value: title }, {field: "playcount", operator: "is", value: "0"} ] }
      break
  }

  var body = {
    jsonrpc: "2.0",
    id: id,
    method: method,
    params: {
      sort: { order: "ascending", method: "title", ignorearticle: true },
      filter: filter,
      properties: [ "title", "file" ],
      limits: { start : 0, end: 5 }
    }
  }

  var req = {
    url: 'http://' + AssistantKodi.hostConf + "/jsonrpc",
    headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'assistant-plugin'
    },
    method: 'POST',
    body: body,
    json: true
  }

  request(req)
  .then(function(response){
    AssistantKodi.getSearchItem (response, library)
    .then(function(response){
      AssistantKodi.playFromSearch (response.file, response.title)
    })
    .catch(function(err){
      console.log(err)
      return (err)
    })
  })
  .catch(function(err){
    console.log(err)
    return (err)
  })
}

AssistantKodi.playFromSearch = (file, title) => {
  var body = {
    jsonrpc: "2.0",
    id: 1,
    method: "Player.Open",
    params: {
      item: { file: file }
    }
  }
  var req = {
    url: 'http://' + AssistantKodi.hostConf + "/jsonrpc",
    headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'assistant-plugin'
    },
    method: 'POST',
    body: body,
    json: true
  }

  request(req)
  .then(function(response){
    console.log("playing "+title)
    return (response)
  })
  .catch(function(err){
    console.log(err)
    return (err)
  })
}

AssistantKodi.getSearchItem = (response, library) => {
  return new Promise(function(resolve, reject) {

    switch (library) {
      case 'movie' :
        var item = response.result.movies[0]
        var bestMatch = item.file
        var bestMatchTitle = item.title
        break
      default :
        var item = response.result.tvshows[0]
        break

    }

    if (library == 'tvshow') {
      AssistantKodi.getEpisodes(item.tvshowid)
      .then(function(response){
        resolve (response)
      })
      .catch(function(err) {
        console.log(err)
        reject (err)
      })
    } else {
      resolve({file: bestMatch, title: bestMatchTitle})
    }

  })
}

AssistantKodi.getEpisodes = (tvShowId) => {
  return new Promise(function(resolve, reject) {
    var body = {
      jsonrpc: "2.0",
      id: "libTvShows",
      method: "VideoLibrary.GetEpisodes",
      params: {
        tvshowid: tvShowId,
        sort: { order: "ascending", method: "playcount" },
        properties: ['title', 'file'],
        filter: { field: "playcount", operator: "is", value: "0" }
      }
    }
    var req = {
      url: 'http://' + AssistantKodi.hostConf + "/jsonrpc",
      headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'assistant-plugin'
      },
      method: 'POST',
      body: body,
      json: true
    }

    request(req)
    .then(function(response){
      resolve ({file:response.result.episodes[0].file, title:response.result.episodes[0].title} )
    })
    .catch(function(err){
      console.log(err)
      reject (err)
    })
  })

}

/**
 * Initialisation du plugin
 *
 * @param  {Object} configuration La configuration
 * @param  {Object} plugins Un objet qui contient tous les plugins chargés
 * @return {Promise} resolve(this)
 */
exports.init = (configuration, plugins) => {
  return new AssistantKodi(configuration).init(plugins)
    .then(resource => {
      console.log("[assistant-kodi] Plugin chargé et prêt.")
      return resource
    })
}
