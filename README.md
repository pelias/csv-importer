>This repository is part of the [Pelias](https://github.com/pelias/pelias)
>project. Pelias is an open-source, open-data geocoder originally sponsored by
>[Mapzen](https://www.mapzen.com/). Our official user documentation is
>[here](https://github.com/pelias/documentation).

# Pelias CSV Importer

**Note:** This repository is still a work in progress

This importer is designed to bring data into Pelias from a properly formattted CSV file.

It's originally based off of the [OpenAddresses importer](https://github.com/pelias/openaddresses), which also uses a CSV format.

## Overview

This importer will process any CSV with the following headers:
* name: for the name of the record
* source: to override the datasource name for that record
* layer: to give that record a layer such as address, venue, etc
* LAT: a latitude
* LON: a longitude

## Requirements

Node.js 4 or higher is required.

## Installation
```bash
git clone https://github.com/pelias/csv-importer
cd csv-importer
npm install
```

## Usage
```bash
# show full command line options
node import.js --help

# run an import
npm start
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
