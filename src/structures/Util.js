const path = require('path');
const { promisify } = require('util');
const glob = promisify(require('glob'));
const Command = require('./Command.js');
const Event = require('./Event.js');

module.exports = class Util {

	constructor(client) {
		this.client = client;
	}

	isClass(input) {
		return typeof input === 'function' &&
        typeof input.prototype === 'object' &&
        input.toString().substring(0, 5) === 'class';
	}

	get directory() {
		return `${path.dirname(require.main.filename)}${path.sep}`;
	}

	trimArray(arr, maxLen = 10) {
		if (arr.length > maxLen) {
			const len = arr.length - maxLen;
			arr = arr.slice(0, maxLen);
			arr.push(`${len} more...`);
		}
		return arr;
	}

	formatBytes(bytes) {
		if (bytes === 0) return '0 Bytes';
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
	}

	removeDupelicates(arr) {
		return [...new Set(arr)];
	}

	capitalize(string) {
		return string.split(" ").map(str => str.slice(0, 1).toUpperCase() + str.slice(1)).join(" ");
	}
	async checkOwner(target) {
		return this.client.owners.includes(target.id)
	}

	

	comparePerms(member, target) {
		return member.roles.highest.position < target.roles.highest.position
	}
	
	formatPerms(perm) {
		return perm
		.toLowerCase()
		.replace(/(^|"|_)(\S)/g, (s) => s.toUpperCase())
		.replace(/_/g, ' ')
		.replace(/Guild/g, 'Server')
		.replace(/Use Vad/g, 'Use Voice Activity')
	}

	formatArray(array, type = 'conjunction') {
		return new Intl.ListFormat('en-GB', {style: 'short', type: type }).format(array)
	}
	
	randomNoRepeat(array) {
		let copy = array.slice(0);
		if (copy.length < 1) { copy = array.slice(0); }
		const index = Math.floor(Math.random() * copy.length);
		const item = copy[index];
		copy.splice(index, 1);
		return item;
}


	async loadCommands() {
		return glob(`${this.directory}commands/**/*.js`).then(commands => {
			for (const commandFile of commands) {
				delete require.cache[commandFile];
				const { name } = path.parse(commandFile);
				const File = require(commandFile);
				if (!this.isClass(File)) throw new TypeError(`Command ${name} doesn't export a class.`);
				const command = new File(this.client, name.toLowerCase());
				if (!(command instanceof Command)) throw new TypeError(`Comamnd ${name} doesnt belong in Commands.`);
				this.client.commands.set(command.name, command);
				if (command.aliases.length) {
					for (const alias of command.aliases) {
						this.client.aliases.set(alias, command.name);
					}
				}
			}
		});
	}



async loadEvents() {
	return glob(`${this.directory}events/**/*.js`).then(events => {
		for(const eventFile of events) {
			delete require.cache[eventFile];
			const { name } = path.parse(eventFile);
			const File = require(eventFile);
			if(!this.isClass(File)) throw new TypeError(`Event ${name} dosen't export a class!`);
			const event = new File(this.client, name.toLowerCase());
			if(!(event instanceof Event)) throw new TypeError(`Event ${name} dosen't belong in the Events directory.`)
			this.client.events.set(event.name, event);
			event.emitter[event.type](name, (...args) => event.run(...args));
		}
	})
	}
	 Emoji(id) {
		return this.client.emojis.cache.get(id).toString();
	  }
	 
}

