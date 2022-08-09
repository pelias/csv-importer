<p align="center">
  <img height="100" src="https://raw.githubusercontent.com/pelias/design/master/logo/pelias_github/Github_markdown_hero.png">
</p>
<h3 align="center">A modular, open-source search engine for our world.</h3>
<p align="center">Pelias is a geocoder powered completely by open data, available freely to everyone.</p>
<p align="center">
<a href="https://en.wikipedia.org/wiki/MIT_License"><img src="https://img.shields.io/github/license/pelias/api?style=flat&color=orange" /></a>
<a href="https://hub.docker.com/u/pelias"><img src="https://img.shields.io/docker/pulls/pelias/api?style=flat&color=informational" /></a>
<a href="https://gitter.im/pelias/pelias"><img src="https://img.shields.io/gitter/room/pelias/pelias?style=flat&color=yellow" /></a>
</p>
<p align="center">
	<a href="https://github.com/pelias/docker">Local Installation</a> ·
        <a href="https://geocode.earth">Cloud Webservice</a> ·
	<a href="https://github.com/pelias/documentation">Documentation</a> ·
	<a href="https://gitter.im/pelias/pelias">Community Chat</a>
</p>
<details open>
<summary>What is Pelias?</summary>
<br />
Pelias is a search engine for places worldwide, powered by open data. It turns addresses and place names into geographic coordinates, and turns geographic coordinates into places and addresses. With Pelias, you’re able to turn your users’ place searches into actionable geodata and transform your geodata into real places.
<br /><br />
We think open data, open source, and open strategy win over proprietary solutions at any part of the stack and we want to ensure the services we offer are in line with that vision. We believe that an open geocoder improves over the long-term only if the community can incorporate truly representative local knowledge.
</details>

# Pelias CSV Importer

This importer is designed to bring data into Pelias from a properly formatted CSV file.

It's originally based off of the [OpenAddresses importer](https://github.com/pelias/openaddresses), which also uses a CSV format.

## Overview

This importer will process any CSV, attempting to create a Pelias document for each row.

In order to be useful, each row needs to define a source, a latitude, a longitude, and a name. Address components can optionally be specified.

This importer will accept any column name as uppercase or lowercase. Lowercase has priority if both are present.

### Latitude
Latitude can come from a column called `lat`. It should be a
[WGS84](https://en.wikipedia.org/wiki/World_Geodetic_System#WGS84) value
between `-90.0` and `90.0`.

### Longitude
Longitude can come from a column called `lon`.  It should be a
[WGS84](https://en.wikipedia.org/wiki/World_Geodetic_System#WGS84) value
between `-180.0` and `180.0`.

### Address
A valid address consists of at least a street, and possibly a housenumber and postalcode.

Valid column names for street are: `street`

Valid column names for housenumber are: `housenumber`, `number`

Valid column names for postalcode are: `postalcode`, `postcode`, `zipcode`

Valid column names for intersections are: `cross_street` (note: `street` is also required!)

## Name
A free-form string that represents the name of a record. It might be
the name of a venue which also has an address, or the name of a city, mountain, or other interesting feature.

Valid column names for name are: `name`.

## Layer
Pelias allows sorting records into different layers, representing different classes of data.

The most common layers are `address`, `street`, and `venue`. Address and street
have special meaning to Pelias: when Pelias looks for an `address`, it can also
attempt to use its [interpolation engine](http://github.com/pelias/interpolation/)
to fill in missing addresses.  If no addresses (exact or interpolated) are
found, Pelias will try to find a `street` record matching the `street` from the
original `address` in the query.

Another type of layer is "administrative" layers such as `city` and `country`.

Layers do not have to fall into these categories. Any layer that doesn't have
special meaning to Pelias can still be use to filter with the `layers`
parameter to the Pelias API.

Valid column names for the layer value are: `layer` and `layer_id`

## Source
Pelias understands that different data records come from different sources, and allows filtering
based on source. Common data projects that represent sources in Pelias include OpenStreetMap,
OpenAddresses, and Who's on First.

Custom data with arbitrary sources are supported by this importer and can be used for user
filtering. The source value won't have any other effect on how Pelias treats a record when querying.

Valid column names for the source value are : `source`

## ID

An ID is a unique identifier for each record. Pelias IDs are strings, so they
can contain text. Pelias records must have a unique source, layer, and ID.
Attempting to create multiple records with the same source, layer and ID will
cause all but the most recent record to be overwritten.

If an ID is not specified for a row in a CSV, the row number will be used.

## Names in multiple Languages

Multiple names in different languages can be assigned by using the `name_$lang` fields, where $lang is an [ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) language code.

For example, to create a record for London in English and French, use the following CSV:

id | name | name_fr | source | layer | lat | lon |
-- | ---- | ------- | ------ | ----- | --- | --- |
1 | London | Londres | custom | locality | 5 | 6 |

## Multiple alias names

A record can have multiple aliases, or alternative names, specified as an array using the `name_json` field.

The following CSV will create a record for [John F Kennedy International Airport](https://en.wikipedia.org/wiki/John_F._Kennedy_International_Airport), with common aliases including `JFK` and `JFK airport`.

id | name | name_json | source | layer | lat | lon |
-- | ---- | ------- | ------ | ----- | --- | --- |
1 | John F Kennedy International Airport | "[""JFK"", ""JFK Airport""]" | custom | venue | 40.639722 | -73.778889

The contents of the `name_json` field must be a JSON array. As a reminder, in CSV files, records that contain commas must be quoted using double quotes, and records with a double quote in the value itself must be double-double-quoted, as shown above.

Aliases and languages can _both_ be specified. For example, the `name_json_es` field allows setting multiple aliases in Spanish.

## Popularity

Popularity values can be specified to mark records as more important than others. This value should be an integer greater than zero, in the `popularity` column.

## Categories

Category values can be added to a record. For a single category, use the `category` field. For multiple categories, use `category_json`, with the same formatting as for alias names.

## Parent

Parent information for record can be added using the `parent_json` field.

Only the valid parent field names specified in the `pelias/model` are supported, records with parent containing unsupported fields names will be ignored with a warning in the logs and will not be imported.

[List of valid fields in pelias/model](https://github.com/pelias/model/blob/master/Document.js), which eventually should match the [list of valid fields in pelias/schema](https://github.com/pelias/schema/blob/master/mappings/document.js).

The contents of the `parent_json` field must be a valid JSON object. An example of the valid contents of `parent_json` field are:

```
    {
	"county": [{
		"id": "34",
		"name": "Innlandet",
		"abbr": "InL",
		"source": "OSM",
	}],
	"country": [{
		"id": "NOR",
		"name": "Norway"
		"abbr": "NO"
	}],
	"locality": [{
		"id": "3403",
		"name": "Hamar"
		"source": "SomeSource"
	}]
    }
```

In CSV files, records that contain commas must be quoted using double quotes, and records with a double quote in the value itself must be double-double-quoted, as shown below in the example for the `parent_json` field.

```
"{""county"":[{""id"":""34"",""name"":""Innlandet""}],""country"":[{""id"":""NOR"",""name"":""NO""}],""locality"":[{""id"":""3403"",""name"":""Hamar""}]}"
```

The valid properties for any parent field are `id`, `name`, `abbr` (abbreviation), `source`, where `id` and `name` are mandatory fields. 
Any other fields will be ignored without any warning. In case the mandatory fields are missing the record will be ignored with the warning in the logs and will not be imported.

In the case where multiple parent values are provided for the same field name, we store all copies in the elastic index, making them all searchable, but only the first entry is used for displaying the label.

## Custom data

Arbitrary custom data that does not fit into the standard Pelias schema can be stored for later retrieval under the `addendum` property.

Currently, custom data is supported when encoded as any valid JSON object. In the future, support for adding individual values via CSV columns will be supported.

Custom data entires are namespaced, so this importer supports any column starting with `addendum_json_`. The rest of the column name will determine the namespace.

For example, to store a WikiData and Geonames concordance ID, the following CSV format might be used:

id | name | source | layer | lat | lon | addendum_json_geonames | addendum_json_wikidata
-- | -- | -- | -- | -- | -- | -- | --
1 | test | custom | venue | 5 | 6 | "{ ""id"": 600 } | { ""id"": ""Q47"" }"

The Pelias [API](https://github.com/pelias/api) will then return a `GeoJSON` `Feature` like the following:

```
{
  "properties": {
    "id": "1",
    "gid": "custom:venue:1",
    "layer": "venue",
    "source": "custom",
    "source_id": "1",
    "name": "test",
    "confidence": 1,
    "match_type": "exact",
    "accuracy": "centroid",
    "label": "London, England, United Kingdom",
    "addendum": {
      "geonames": {
        "id": 600
      },
      "wikidata": {
        "id": "Q47"
      }
    }
  }
}
```

## Requirements

Node.js is required.

See [Pelias software requirements](https://github.com/pelias/documentation/blob/master/requirements.md) for supported versions.

## Installation
```bash
git clone https://github.com/pelias/csv-importer
cd csv-importer
npm install
```

## Usage
```bash
# download files, if desired
./bin/download

# run an import
./bin/start
```

## Downloading CSV files

This importer includes a downloader that supports downloading any uncompressed CSV files over HTTP/HTTPS.

## Configuration
This importer can be configured in [pelias-config](https://github.com/pelias/config), in the `imports.csv`
hash. A sample configuration file might look like:

```javascript
{
  "esclient": {
    "hosts": [
      {
        "env": "development",
        "protocol": "http",
        "host": "localhost",
        "port": 9200
      }
    ]
  },
  "api": {
    "targets": {
      "yoursource": ["yourlayers"]
    }
  },
  "logger": {
    "level": "debug"
  },
  "imports": {
    "whosonfirst": {
      "datapath": "/mnt/data/whosonfirst/",
      "importPostalcodes": false,
      "importVenues": false
    },
    "csv": {
      "datapath": "/path/to/your/csv/files",
      "files": [],
      "download": [
        "https://example.com/csv-to-download.csv"
      ]
    }
  }
}
```

**Important:** You must put any custom source and layers imported by your data in `pelias.json` as explained in the relevant [API configuration documentation](https://github.com/pelias/api#custom-sources-and-layers). For a reasonably common use case for the source `csv` with only records in the `address` layer, the following configuration is a good starting point:


```
{
  "api": {
    "targets": {
      "csv": ["address"]
    }
  }
}
```

The following properties are recognized:

This importer is configured using the [`pelias-config`](https://github.com/pelias/config) module.
The following configuration options are supported by this importer.

| key | required | default | description |
| --- | --- | --- | --- |
| `datapath` | yes | | The absolute path of the directory containing data files, or where downloaded files will be stored. |
| `files` | no | `[]` | An array of the names of the files to import. If specified, *only* these files will be imported. If not specified, or empty,  *all* `.csv` files in the given directory will be imported. |
| `download` | no | `[]` | An array of URLs of CSV files that can be downloaded. Files must be plain-text (uncompressed) CSV files |
