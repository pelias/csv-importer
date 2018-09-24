>This repository is part of the [Pelias](https://github.com/pelias/pelias)
>project. Pelias is an open-source, open-data geocoder originally sponsored by
>[Mapzen](https://www.mapzen.com/). Our official user documentation is
>[here](https://github.com/pelias/documentation).

# Pelias CSV Importer

**Note:** This repository is still a work in progress

This importer is designed to bring data into Pelias from a properly formattted CSV file.

It's originally based off of the [OpenAddresses importer](https://github.com/pelias/openaddresses), which also uses a CSV format.

## Overview

This importer will process any CSV, attempting to create a Pelias document for each row.

In order to be useful, each row needs to define a latitude, a longitude, and either an address, name or both.

This importer will accept any colum name as uppercase or lowercase. Lowercase has priority if both are present.

### Latitude
Latitude can come from a column called `lat`

### Longitude
Longitude can come from a column called `lon`

### Address
A valid address consists of at least a street, and possibly a housenumber and postalcode.

Valid column names for street are: `street`
Valid column names for housenumber are: `housenumber`, `number`
Valid column names for postalcod are: `postalcode`, `zipcode`

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

## Requirements

Node.js 6 or higher is required.

## Installation
```bash
git clone https://github.com/pelias/csv-importer
cd csv-importer
npm install
```

## Usage
```bash
# run an import
./bin/start
```

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
      "files": []
    }
  }
}
```

The following properties are recognized:

This importer is configured using the [`pelias-config`](https://github.com/pelias/config) module.
The following configuration options are supported by this importer.

| key | required | default | description |
| --- | --- | --- | --- |
| `datapath` | yes | | The absolute path of the directory containing data files. Must be specified if no directory is given as a command-line argument. |
| `files` | no | | An array of the names of the files to import. If specified, *only* these files will be imported, rather than *all* `.csv` files in the given directory.
