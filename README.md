>This repository is part of the [Pelias](https://github.com/pelias/pelias)
>project. Pelias is an open-source, open-data geocoder originally sponsored by
>[Mapzen](https://www.mapzen.com/). Our official user documentation is
>[here](https://github.com/pelias/documentation).

# Pelias CSV Importer

[![Greenkeeper badge](https://badges.greenkeeper.io/pelias/csv-importer.svg)](https://greenkeeper.io/)

This importer is designed to bring data into Pelias from a properly formatted CSV file.

It's originally based off of the [OpenAddresses importer](https://github.com/pelias/openaddresses), which also uses a CSV format.

## Overview

This importer will process any CSV, attempting to create a Pelias document for each row.

In order to be useful, each row needs to define a source, a latitude, a longitude, and either an address, name or both.

This importer will accept any column name as uppercase or lowercase. Lowercase has priority if both are present.

### Latitude
Latitude can come from a column called `lat`

### Longitude
Longitude can come from a column called `lon`

### Address
A valid address consists of at least a street, and possibly a housenumber and postalcode.

Valid column names for street are: `street`

Valid column names for housenumber are: `housenumber`, `number`

Valid column names for postalcode are: `postalcode`, `zipcode`

Valid column names for intersections are: `cross_street` (note: `street` is also required!)

## Name
A name is a free-form string that represents the name of a record. It might be
the name of a venue which also has an address, or the name of a city, mountain, or other interesting feature.

Valid column names for name are: `name`

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
