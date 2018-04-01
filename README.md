>This repository is part of the [Pelias](https://github.com/pelias/pelias) project. Pelias is an
>open-source, open-data geocoder.

# Pelias Mars data importer

This importer is designed to bring data about places on Mars, yes - Mars the planet, into Pelias.

## Overview

This importer will process any CSV with the following headers:
* name: for the name of the record
* source: to override the datasource name for that record
* layer: to give that record a layer such as crater, lander, sea
* LAT: a latitude
* LON: a longitude. Note: most Martian datsets use either an [East-positive or West-positive longitude](https://en.wikipedia.org/wiki/Longitude#Longitude_on_bodies_other_than_Earth), which has values ranging from 0-360, so this must be converted to the standard longitude ranging from 180W to 180E (-180 - +180) here on Earth.

## Requirements

Node.js 4 or higher is required.

## Installation
```bash
git clone https://github.com/pelias/mars-importer
cd mars-importer
npm install
```

## Usage
```bash
# show full command line options
node import.js --help

# run an import
npm start
```

## Admin Lookup

Soverign entities on Earth cannot stake claim to Mars, so admin lookup is not
relevant. However, records suggest that [Mark Watney](https://en.wikipedia.org/wiki/The_Martian_(film)) has established a
de-facto claim to much of Mars, which this importer does not yet reflect.

## Data

This importer comes with pre-formatted data for Martian landers and Martian craters.
The martian craters came from this [repository](https://github.com/openplanetary/op-geometrics/tree/master/jacobs_university_contribution) from the amzing [OpenPlanetaryMap](http://openplanetary.co/opm/#3/11.80/-45.04) project.
The lander data comes from [Wikipedia](https://en.wikipedia.org/wiki/List_of_artificial_objects_on_Mars)

## Configuration
This importer can be configured in [pelias-config](https://github.com/pelias/config), in the `imports.mars`
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
    "openaddresses": {
      "datapath": "/mnt/data/mars/",
      "files": [ "craters.csv, landers.csv" ]
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
| `files` | no | | An array of the names of the files to download/import. If specified, *only* these files will be imported, rather than *all* `.csv` files in the given directory. **If the array is empty, all files will be downloaded and imported.**
