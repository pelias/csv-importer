var tape = require( 'tape' );
var path = require( 'path' );
var fs = require('fs');
var proxyquire = require('proxyquire').noCallThru();

var temp = require( 'temp' ).track();

const config = require('pelias-config');

// fake FS module that always says a file is present
const fakeFsModule = {
  statSync: function() {
    return {
      isDirectory: function() {
        return true
      }
    };
  },
  existsSync: function() {
    return true;
  }
};

var parameters_default = proxyquire( '../lib/parameters', {
  'pelias-config': {
    generate: config.generateDefaults
  },
  fs: fakeFsModule
});


tape( 'interpretUserArgs() allows missing datapath', function ( test ){
  var parametersForThisTest = proxyquire( '../lib/parameters', {
    fs: fakeFsModule,
    'pelias-config': {
      generate: config.generateDefaults
    }
  });

  const input = [ ]; // pass no input

  const expectedParamOutput = {
    errMessage: 'No datapath configured, nothing to do',
    exitCode: 0,
  };


  const actual = parametersForThisTest.interpretUserArgs(input);
  test.deepEqual(actual, expectedParamOutput, 'Non-failure exit code and message set');
  test.end();
});

tape('interpretUserArgs returns dir from pelias config if set', function(test) {
  temp.mkdir('tmpdir2', function(err, temporary_dir) {
    var customPeliasConfig = {
      generate: function() {
        return config.generateCustom( {
          imports: {
            csv: {
              datapath: temporary_dir
            }
          }
        });
      }
    };

    const parameters = proxyquire('../lib/parameters', {
      'pelias-config': customPeliasConfig
    });

    var input = [];
    var result = parameters.interpretUserArgs(input);

    test.equal(result.dirPath, temporary_dir, 'path should be equal to path from config');
    temp.cleanupSync();
    test.end();
  });
});

tape('interpretUserArgs returns normalized path from config', function(test) {
  temp.mkdir('tmpdir2', function(err, temporary_dir) {
    var input_dir = path.sep + '.' + temporary_dir;
    var customPeliasConfig = {
      generate: function() {
        return config.generateCustom({
          imports: {
            csv: {
              datapath: input_dir
            }
          }
        });
      }
    };

    const parameters = proxyquire('../lib/parameters', {
      'pelias-config': customPeliasConfig
    });

    var input = [];
    var result = parameters.interpretUserArgs(input);

    var expected_dir = path.normalize(input_dir);
    test.equal(result.dirPath, expected_dir, 'path should be equal to path from config');
    temp.cleanupSync();
    test.end();
  });
});

tape('getFileList returns all .csv path names when config has empty files list', function(test) {
  temp.mkdir('multipleFiles', function(err, temp_dir) {
    // add some files to the data path to be globbed
    fs.mkdirSync(path.join(temp_dir, 'dirA'));
    fs.writeFileSync(path.join(temp_dir, 'dirA', 'fileA.csv'), '');

    fs.mkdirSync(path.join(temp_dir, 'dirB'));
    fs.writeFileSync(path.join(temp_dir, 'dirB', 'fileB.csv'), '');

    fs.writeFileSync(path.join(temp_dir, 'fileC.csv'), '');

    // should not be included since it's not a .csv file
    fs.writeFileSync(path.join(temp_dir, 'fileD.txt'), '');

    var peliasConfig = {
      imports: {
        csv: {
          files: []
        }
      }
    };
    var args = {
      dirPath: temp_dir
    };

    var actual = parameters_default.getFileList(peliasConfig, args);

    test.equal(actual.length, 3);
    test.ok(actual.find((f) => f === path.join(temp_dir, 'dirA', 'fileA.csv')));
    test.ok(actual.find((f) => f === path.join(temp_dir, 'dirB', 'fileB.csv')));
    test.ok(actual.find((f) => f === path.join(temp_dir, 'fileC.csv')));
    temp.cleanupSync();
    test.end();

  });
});

tape('getFileList returns all .csv path names when config doesn\'t have files property', function(test) {
  temp.mkdir('multipleFiles', function(err, temp_dir) {
    // add some files to the data path to be globbed
    fs.mkdirSync(path.join(temp_dir, 'dirA'));
    fs.writeFileSync(path.join(temp_dir, 'dirA', 'fileA.csv'), '');

    fs.mkdirSync(path.join(temp_dir, 'dirB'));
    fs.writeFileSync(path.join(temp_dir, 'dirB', 'fileB.csv'), '');

    fs.writeFileSync(path.join(temp_dir, 'fileC.csv'), '');

    // should not be included since it's not a .csv file
    fs.writeFileSync(path.join(temp_dir, 'fileD.txt'), '');

    var peliasConfig = {
      imports: {
        csv: {
        }
      }
    };
    var args = {
      dirPath: temp_dir
    };

    var actual = parameters_default.getFileList(peliasConfig, args);

    test.equal(actual.length, 3);
    test.ok(actual.find((f) => f === path.join(temp_dir, 'dirA', 'fileA.csv')));
    test.ok(actual.find((f) => f === path.join(temp_dir, 'dirB', 'fileB.csv')));
    test.ok(actual.find((f) => f === path.join(temp_dir, 'fileC.csv')));
    temp.cleanupSync();
    test.end();

  });
});

tape('getFileList returns fully qualified path names when config has a files list', function(test) {
  temp.mkdir('multipleFiles', function(err, temporary_dir) {
    var peliasConfig = {
      imports: {
        csv: {
          files: ['filea.csv', 'fileb.csv']
        }
      }
    };
    var args = {
      dirPath: temporary_dir
    };

    var expected = [path.join(temporary_dir, 'filea.csv'), path.join(temporary_dir, 'fileb.csv')];

    var actual = parameters_default.getFileList(peliasConfig, args);

    test.deepEqual(actual, expected, 'file names should be equal');
    temp.cleanupSync();
    test.end();
  });
});

tape('getFileList handles parallel builds', function(test) {
  var peliasConfig = {
    imports: {
      csv: {
        files: ['filea.csv', 'fileb.csv', 'filec.csv']
      }
    }
  };

  temp.mkdir('parallelBuilds', function(err, temporary_dir) {
    test.test('3 workers, id 0', function(t) {
      var args = {
        dirPath: temporary_dir,
        'parallel-count': 3,
        'parallel-id': 0
      };

      var expected = [path.join(temporary_dir, 'filea.csv')];

      var actual = parameters_default.getFileList(peliasConfig, args);

      t.deepEqual(actual, expected, 'only first file is indexed');
      t.end();
    });

    test.test('3 workers, id 1', function(t) {
      var args = {
        dirPath: temporary_dir,
        'parallel-count': 3,
        'parallel-id': 1
      };

      var expected = [path.join(temporary_dir, 'fileb.csv')];

      var actual = parameters_default.getFileList(peliasConfig, args);

      t.deepEqual(actual, expected, 'only second file indexed');
      t.end();
    });

    test.test('3 workers, id 2', function(t) {
      var args = {
        dirPath: temporary_dir,
        'parallel-count': 3,
        'parallel-id': 2
      };

      var expected = [path.join(temporary_dir, 'filec.csv')];

      var actual = parameters_default.getFileList(peliasConfig, args);

      t.deepEqual(actual, expected, 'only third file indexed');
      t.end();
    });

    test.test('3 workers, id 3', function(t) {
      var args = {
        dirPath: temporary_dir,
        'parallel-count': 3,
        'parallel-id': 3
      };

      var expected = [];

      var actual = parameters_default.getFileList(peliasConfig, args);

      t.deepEqual(actual, expected, 'file list is empty');
      temp.cleanupSync();
      t.end();
    });
    test.end();
  });
});
