const _list = require('./lang.json').words;

class Filter {
	constructor(options = {}) {
		Object.assign(this, {
			list: options.emptyList && [] || Array.prototype.concat.apply(_list, [_list, options.list || []]),
			exclude: options.exclude || [],
			splitRegex: options.splitRegex || /\b/,
			placeHolder: options.placeHolder || '*',
			regex: options.regex || /[^a-zA-Z0-9|\$|\@]|\^/g,
			replaceRegex: options.replaceRegex || /\w/g
		})
	}

	isProfane(string) {
		return this.list
			.filter((word) => {
				const wordExpPattern = '\\b' + word.replace(/(\W)/g, '\\$1') + '\\b';
				const wordExp = new RegExp(wordExpPattern, 'gi');
				return !this.exclude.includes(word.toLowerCase()) && wordExp.test(string);
			})
			.length > 0 || false;
	}

	replaceWord(string) {
		return string
			.replace(this.regex, '')
			.replace(this.replaceRegex, this.placeHolder);
	}

	clean(string) {
		return string.split(this.splitRegex).map((word) => {
			return this.isProfane(word) ? this.replaceWord(word) : word;
		}).join(this.splitRegex.exec(string)[0]);
	}

	addWords() {
		let words = Array.from(arguments);

		this.list.push(...words);

		words
			.map(word => word.toLowerCase())
			.forEach((word) => {
				if (this.exclude.includes(word)) {
					this.exclude.splice(this.exclude.indexOf(word), 1);
				}
			});
	}

	removeWords() {
		this.exclude.push(...Array.from(arguments).map(word => word.toLowerCase()));
	}
}

module.exports = Filter;