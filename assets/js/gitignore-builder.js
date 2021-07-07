"use strict";

class IgnoreRegistry {
	constructor(key, file) {
		this.key = key;
		this.file = file;
		this.title = '';
		this.reference = '';
		this.description = '';

		this.contents = null;
	}

	async getContents() {
		if (this.contents === null) {
			this.contents = await (
				fetch(IgnoreRegistry.Path + this.file)
					.then(resp => {
						return resp.text();
					})
			)
		}

		return this.contents;
	}

    /**
     * Get either the description ("desc") or title if not set
     *
     * Useful in the UI
     *
     * @return {string}
     */
	getDescription() {
	    if(this.description) {
	        return this.description;
        }
	    else {
	        return this.title;
        }
    }

	getHeader() {
		let html = '';

		html += '#'.repeat(IgnoreRegistry.LineWidth) + '\n';

		if (this.title.length + 5 >= IgnoreRegistry.LineWidth) {
			html += '#'.repeat(4) + ' ' + this.title + '\n';
		} else {
			html += '#'.repeat(4) + ' '.repeat(Math.floor(IgnoreRegistry.LineWidth - this.title.length) / 2 + 1) + this.title + '\n';
		}

		if (this.reference) {
			html += '#'.repeat(4) + '\n';
			html += '#'.repeat(4) + ' @see ' + this.reference + '\n';
		}

		html += '#'.repeat(IgnoreRegistry.LineWidth) + '\n\n';

		return html;
	}

	async render() {
		return await (
			this.getContents()
				.then(contents => {
					return this.getHeader() + contents + '\n\n\n';
				})
		);
	}

	static Registry = [];

	static LineWidth = 80;

	static Path = '';

	/**
	 * Get all keys for the loaded entries
	 *
	 * @returns {string[]}
	 */
	static GetKeys() {
		let keys = [];

		for (let i = 0; i < IgnoreRegistry.Registry.length; i++) {
			keys.push(IgnoreRegistry.Registry[i].key);
		}

		return keys;
	}

	/**
	 * Get the given registry entry, or NULL if it does not exist
	 *
	 * @param {string} key
	 * @returns {null|IgnoreRegistry}
	 */
	static GetEntry(key) {
		for (let i = 0; i < IgnoreRegistry.Registry.length; i++) {
			if (IgnoreRegistry.Registry[i].key === key) {
				return IgnoreRegistry.Registry[i];
			}
		}

		return null;
	}

	/**
	 * Get all the selected entries
	 *
	 * @returns {IgnoreRegistry[]}
	 */
	static GetSelectedEntries() {
		let entries = [];

		document.querySelectorAll('.registry:checked').forEach(el => {
			let entry = IgnoreRegistry.GetEntry(el.value);
			if (entry !== null) {
				// Only add valid entries
				entries.push(entry);
			}
		});

		return entries;
	}

	/**
	 * Get all the selected keys
	 *
	 * @returns {string[]}
	 */
	static GetSelectedKeys() {
		let entries = [];

		document.querySelectorAll('.registry:checked').forEach(el => {
			entries.push(el.value);
		});

		return entries;
	}

	static GetFileHeader() {
		let url, keys = IgnoreRegistry.GetSelectedKeys();

		if (keys.length === 0) {
			return '# No tools selected' + '\n';
		} else {
			// Use this instead of URL(...) because we don't actually want to escape it.
			url = window.location.origin + window.location.pathname;
			url += '?files=' + keys.join(',');

			//url = new URL(window.location);
			//url.searchParams.set('files', keys.join(','));
			return '# This file has been generated automatically,\n' +
				'# you can use the following URL to make changes:\n' +
				'#\n' +
				//'# ' + url.toString() + '\n' +
				'# ' + url + '\n' +
				'#\n' +
				'# To allow for easy maintaining, please add any custom settings at the bottom.\n' +
				'#\n\n';
		}
	}

	static GetFileFooter() {
		let keys = IgnoreRegistry.GetSelectedKeys();

		if (keys.length === 0) {
			return '';
		} else {
			let title = 'Custom Directives';

			return '#'.repeat(IgnoreRegistry.LineWidth) + '\n' +
				'#'.repeat(4) + ' '.repeat(Math.floor(IgnoreRegistry.LineWidth - title.length) / 2 + 1) + title + '\n' +
				'#'.repeat(IgnoreRegistry.LineWidth) + '\n\n';
		}
	}

	static async GetSelectedOutput() {
		let output = IgnoreRegistry.GetFileHeader(),
			entries = IgnoreRegistry.GetSelectedEntries();

		for (let i = 0; i < entries.length; i++) {
			output += await entries[i].render();
		}

		return output + IgnoreRegistry.GetFileFooter();
	}

	static Run(path) {
		IgnoreRegistry.Path = path;

		// Load the registry of files
		fetch(IgnoreRegistry.Path + 'registry.yaml')
			.then(resp => {
				if (resp.status === 200) {
					return resp.text();
				} else {
					throw new Error('Registry could not be located');
				}
			})
			.then(text => {
				// Parse the contents as a YAML object
				return jsyaml.load(text);
			})
			.then(registry => {
				// Load all entries into the registry
				Object.keys(registry).forEach(groupKey => {
					Object.keys(registry[groupKey]).forEach(sectionKey => {
						let entryData = registry[groupKey][sectionKey],
							entry = new IgnoreRegistry(groupKey + '/' + sectionKey, entryData['file']);

						if (typeof (entryData['title']) !== 'undefined') {
							entry.title = entryData['title'];
						}

						if (typeof (entryData['ref']) !== 'undefined') {
							entry.reference = entryData['ref'];
						}

						if (typeof (entryData['desc']) !== 'undefined') {
							entry.description = entryData['desc'];
						}

						IgnoreRegistry.Registry.push(entry);
					});
				});
			})
			.then(() => {
				// Render the entries (sorted), into the UI
				let keys = IgnoreRegistry.GetKeys().sort(),
					html = '',
					entry,
					selectionArea = document.getElementById('selection-area');

				for (let i = 0; i < keys.length; i++) {
					entry = IgnoreRegistry.GetEntry(keys[i]);

					if (entry === null) {
						console.error('Unable to load entry ' + keys[i] + ', was not available in registry');
					} else {
						html += '<label title="' + entry.getDescription().replace(/"/g, '&quot;') + '">' +
							'<input type="checkbox" class="registry" name="registry[]" value="' + entry.key + '"/>' +
							'<span>' + entry.title + '</span>' +
							'</label>';
					}
				}

				selectionArea.innerHTML = html;
			})
			.then(() => {
				// Setup events
				document.querySelectorAll('.registry').forEach(el => {
					el.addEventListener('click', evt => {
						IgnoreRegistry.GetSelectedOutput().then(contents => {
							document.getElementById('render-area').value = contents;
						});
					});
				});
			})
			.then(() => {
				// Initial window load request
				let url = new URL(window.location),
					q = url.searchParams.get('files'),
					c;

				if (q) {
					q = q.split(',');
					for (let i = 0; i < q.length; i++) {
						c = document.querySelector('.registry[value="' + q[i] + '"]');
						if (c) {
							c.checked = true;
						}
					}
					IgnoreRegistry.GetSelectedOutput().then(contents => {
						document.getElementById('render-area').value = contents;
					});
				}
			})
			.catch(e => {
				console.error(e);
				alert('Unable to load registry!');
			});
	}
}
