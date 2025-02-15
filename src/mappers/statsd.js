// Copyright © 2014, 2015, 2016 Springer Nature
//
// This file is part of boomcatch.
//
// Boomcatch is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Boomcatch is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with boomcatch. If not, see <http://www.gnu.org/licenses/>.

/*globals require, module */

'use strict';

var check, normalise;

check = require('check-types');
normalise = require('../normalise');

module.exports = {
    initialise: function (options) {
        return map.bind(null, normalisePrefix(options.prefix));
    },
    separator: '\n'
};

function normalisePrefix (prefix) {
    if (check.unemptyString(prefix)) {
        if (prefix[prefix.length - 1] === '.') {
            return prefix;
        }

        return prefix + '.';
    }

    return '';
}

function map (prefix, data, referer) {
    var result = '';

    data = normalise(data);

    Object.keys(data).forEach(function (category) {
		var mapper;
		let tempPrefix;

		if (category === 'restiming') {
			mapper = mapRestimingMetrics;
			tempPrefix = prefix + category;
        } else {
			mapper = mapMetrics;
			const url = data[category] ? (cleanResource(data[category].url, 'pageUrl', referer) + '.') : '';
			tempPrefix = prefix + category + '.' + url;
        }

        if (data[category]) {
            result += mapper(tempPrefix, data[category], referer);
        }
    });

    return result;
}

function mapRestimingMetrics (prefix, data, referer) {
    return data.map(function (resource, index) {
        if (!resource) {
            return '';
        }

        return mapMetrics([
            prefix,
            // index,
            resource.type,
            cleanResource(resource.name, resource.type, referer)
        ].join('.') + '.', resource);
    }).join('');
}

function cleanResource(name, type, referer) {
	if (type === 'xmlhttprequest') {
		return name.replace(referer, '/').replace(/\?.*/, '');
	} else if(type === 'pageUrl') {
		return name.replace(referer, '').replace('#/', '').replace(/\?.*/, '');
	} else {
		return name.replace(/.*\//, '');
	}

}

function base36Encode (string) {
    if (!string) {
        return 'unknown';
    }

    return Array.prototype.map.call(string, function (character) {
        return character.charCodeAt(0).toString(36);
    }).join('');
}

function mapMetrics (prefix, data) {
    return mapEvents(prefix, data) + mapDurations(prefix, data);
}

function mapEvents (prefix, data) {
    return Object.keys(data.events).map(function (metric) {
        var datum = data.events[metric];

        if (check.object(datum)) {
            return mapMetric(prefix, metric, datum.end - datum.start);
        }

        return '';
    }).join('');
}

function mapMetric (prefix, name, value) {
    if (value <= 0) {
        return '';
    }

    return prefix + name + ':' + value + '|ms' + '\n';
}

function mapDurations (prefix, data) {
    return Object.keys(data.durations).map(function (metric) {
        var datum = data.durations[metric];

        if (check.number(datum)) {
            return mapMetric(prefix, metric, datum);
        }

        return '';
    }).join('');
}

