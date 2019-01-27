
# assistant-kodi

Ce plugin de [`assistant-plugins`](https://aymkdn.github.io/assistant-plugins/) permet de gérer les commandes [`JSONRPC Kodi`](https://kodi.wiki/view/JSON-RPC_API).

**ATTENTION**, il faut avoir activé JSONRPC sur Kodi.

## Installation

Si vous n'avez pas installé [`assistant-plugins`](https://aymkdn.github.io/assistant-plugins/), alors il faut le faire, et sélectionner **kodi** comme plugin.

Si vous avez déjà installé [`assistant-plugins`](https://aymkdn.github.io/assistant-plugins/), et que vous souhaitez ajouter ce plugin, alors :
  - Pour Windows, télécharger [`install_kodi.bat`](https://github-proxy.kodono.info/?q=https://raw.githubusercontent.com/5AMsan/assistant-kodi/master/install_kodi.bat&download=install_kodi.bat) dans le répertoire `assistant-plugins`, puis l'exécuter en double-cliquant dessus.  
  - Pour Linux/MacOS, ouvrir une console dans le répertoire `assistant-plugins` et taper :  
  `npm install assistant-kodi@latest --save --loglevel error && npm run-script postinstall`

## Configuration

Deux paramètres sont obligatoires: `host` et `port`, respectivement l'adresse IP ou le nom d'hôte de Kodi et le port de communication JSONRPC (9090 la plupart du temps, mais souvent 8080 sur les distributions Mediacenter).

## Applets IFTTT

Le plugin est prévu pour fonctionner avec des applets configurés comme suit :

 - This : Google Assistant
 - That : PushBullet Note
 - Je vous laisse décider des commmandes vocales et des retours...
 - Titre de la note : Assistant (comme toutes les notes pour Assistant-Plugin)
 - Message : `kodi_METHOD#{ JSON:'Object', { nested: ['array'] } }`

### Détails du message

*kodi* est obligatoire pour déclencher les actions du plugin. 
*METHOD* est la méthode conformément à la documentation [`JSONRPC`](https://kodi.wiki/view/JSON-RPC_API) de Kodi, par exemple `Input.Home`. 
Enfin un objet JSON optionnel. Il est nécessaire d'espacer les `{}` afin de permettre l'enregistrement de la note sous peine de voir sa note refusée pour cause d'erreur de syntaxe ;-)
