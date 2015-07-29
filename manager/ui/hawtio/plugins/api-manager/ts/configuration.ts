/// <reference path="../../includes.ts"/>
module ApimanConfiguration {

    export var _module = angular.module("ApimanConfiguration", []);

    var apiEndpointConfig = "dynamic";
    var dynamicEndpoint;

    export var Configuration = _module.factory('Configuration', ['$rootScope','$window','KubernetesModel','ServiceRegistry','Logger',
        function($rootScope, $window, KubernetesModel, ServiceRegistry, Logger) {

            var cdata:any = {};

            //Get's called back so we can update the endpoint settings when the namespace changes
            $rootScope.$on('kubernetesModelUpdated', function () {
               //if the endpoint config does not start with 'dynamic' then simple use it as is.
               if (apiEndpointConfig.indexOf("dynamic") == 0) {
                 var namespace = KubernetesModel.currentNamespace();
                 var hasService = ServiceRegistry.hasService("apiman");
                 if (hasService == true && namespace != null) {
                   var service = KubernetesModel.getService(namespace, "apiman");
                   Logger.debug("apiman route: " + ServiceRegistry.serviceLink("apiman"));
                   Logger.debug("apiman proxyUrl: " + service.proxyUrl);
                   Logger.debug("apiman serviceUrl: " + service.$serviceUrl);
                   if (apiEndpointConfig == "dynamicServiceUrl") {
                       dynamicEndpoint = service.$serviceUrl;
                   } else if (apiEndpointConfig == "dynamicproxyUrl") { 
                       dynamicEndpoint = service.proxyUrl;
                   } else {
                       dynamicEndpoint =  ServiceRegistry.serviceLink("apiman") + "apiman";
                   }
                   cdata.api.endpoint = dynamicEndpoint;
                   Logger.info("Apiman Dynamic Endpoint: " + dynamicEndpoint);
                 } else {
                   cdata.api.endpoint = "no-apiman-running-in-" + namespace + "-namespace";
                   Logger.debug("No apiman running in " + namespace + " namespace");
                 }  
              }
            });

            if ($window['APIMAN_CONFIG_DATA']) {
                cdata = angular.copy($window['APIMAN_CONFIG_DATA']);
                apiEndpointConfig = cdata.api.endpoint.toLowerCase();
                if (apiEndpointConfig.indexOf("dynamic") == 0) { 
                   cdata.api.endpoint = dynamicEndpoint;
                } else {
                   apiEndpointConfig = "static";
                } 
                delete $window['APIMAN_CONFIG_DATA'];
            }
            cdata.getAuthorizationHeader = function() {
                var authHeader = null;
                if (cdata.api.auth.type == 'basic') {
                    var username = cdata.api.auth.basic.username;
                    var password = cdata.api.auth.basic.password;
                    var enc = btoa(username + ':' + password);
                    authHeader = 'Basic ' + enc;
                } else if (cdata.api.auth.type == 'bearerToken') {
                    var token = cdata.api.auth.bearerToken.token;
                    authHeader = 'Bearer ' + token;
                } else if (cdata.api.auth.type == 'authToken') {
                    var token = cdata.api.auth.bearerToken.token;
                    authHeader = 'AUTH-TOKEN ' + token;
                }
                return authHeader;
            };
            return cdata;
        }]);

}
