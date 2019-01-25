var request = require('request-promise-native');

var AssistantKodi = function(configuration) {
  this.host = configuration.host;
  this.port = configuration.port | 8080;
  this.reconnect = configuration.reconnect | false;
  this.reconnectSleep = configuration.reconnectSleep | 3000;
  this.connectionTimeout = configuration.connectionTimeout | 10000;
  this.sendTimeout = configuration.sendTimeout | 3000;
}

AssistantKodi.prototype.init = function(plugins) {

  var _this = this
  this.plugins = plugins

  if (!this.host) Promise.reject("[assistant-kodi] Erreur : vous devez configurer ce plugin !")

  return Promise.resolve(this)

};

/**
 * Fonction appelée par le système central
 *
 * @param {String} commande Le nom du event WebHook créé sur IFTTT
 * @param {Object} [params] Peut contenir 'value1', 'value2' et 'value3'
 */
AssistantKodi.prototype.action = function(commande) {
  var method = commande,
      params = null

  // si '#' dans la commande, on recupère l'objet
  if ( method.indexOf('#') > -1) {
    arr = method.split('#')
    method = arr[0]
    params = JSON.parse(arr[1]);
  }

  var body = {
    jsonrpc: "2.0",
    id: 1,
    method: method,
    params: params
  }

  var req = {
    url: 'http://' + this.host + ':' + this.port + "/jsonrpc",
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
    console.log(response.result)
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
