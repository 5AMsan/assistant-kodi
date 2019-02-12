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
AssistantKodi.prototype.action = function(commande) {
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

  } else {
    if ( this.hosts[Object.keys(this.hosts)[0]] )
      hostConf = this.hosts[Object.keys(this.hosts)[0]].host + ":" + this.hosts[Object.keys(this.hosts)[0]].port
    // legacy conf
    else if (this.host)
      hostConf = this.host + ":" + this.port
  }

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

};

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
