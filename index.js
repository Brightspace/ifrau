import Host from './lib/host';
import Client from './lib/client';
var Q = require('q');

export function createHost(data) {

	var deferred = Q.defer();

	var host = new Host(data.id, data.src, function() {
		deferred.resolve(host);
	});

	return deferred.promise;

}

export function createClient() {

	var deferred = Q.defer();

	var client = new Client(function(c) {
		deferred.resolve(c);
	});

	return deferred.promise;

}
