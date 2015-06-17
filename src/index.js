import Host from './host';
import Client from './client';

export function createHost(data) {
	return new Promise((resolve, reject) => {
		var host = new Host(data.id, data.src, function() {
			resolve(host);
		});
	});
}

export function createClient() {
	return new Promise((resolve, reject) => {
		var client = new Client(function(c) {
			resolve(c);
		});
	});
}
