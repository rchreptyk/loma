/*global module:false*/
module.exports = function(grunt) {
  var rewriteRulesSnippet = require('grunt-connect-rewrite/lib/utils').rewriteRequest;

  var serverOptions = {
    base: 'src',
    debug: !!(process.env.DEBUG || process.env.DEBUG),
    hostname: '0.0.0.0',
    open: !!(process.env.OPEN || process.env.open),
    port: process.env.PORT || process.env.port || 9000
  };

  var developmentOptions = {};
  Object.keys(serverOptions).forEach(function(k) {
    developmentOptions[k] = serverOptions[k];
  });
  developmentOptions.middleware = function(connect, options) {
    return [
      // RewriteRules support
      rewriteRulesSnippet,
      // Mount filesystem
      connect.static(require('path').resolve(options.base))
    ];
  };

  grunt.initConfig({
    connect: {
      server: {
        options: serverOptions,
      },
      rules: [
        // TODO: If a URI contains a trailing slash, strip and redirect.
        {from: '^/search([\?].*)?$', to: '/index.html'},
        {from: '^/submit([\?].*)?$', to: '/index.html'}
      ],
      development: {
        options: developmentOptions
      }
    },
    jshint: {
      src: ['Gruntfile.js', 'src/**/*.js'],
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        browser: true,
        globals: {
          require: true,
          define: true,
          requirejs: true,
          describe: true,
          expect: true,
          it: true
        }
      }
    },
    nunjucks: {
      precompile: {
        baseDir: 'src/templates/',
        src: 'src/templates/*',
        dest: 'src/templates.js',
      }
    },
    concat: {
      dist: {
        options: {
          process: function(src, filepath) {
            // TODO: Remove this when https://github.com/jlongster/nunjucks/issues/186 gets fixed.
            return src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
          }
        },
        src: [
          'src/lib/l10n.js',
          'src/templates.js',
          'src/lib/nunjucks-slim.js',
          'src/lib/routes.js',
          'src/lib/promise-0.1.1.js',
          'src/main.js',
        ],
        dest: 'dist/main.min.js'
      }
    },
    cssmin: {
      minify: {
        expand: true,
        cwd: 'src/',
        src: ['style.css'],
        dest: 'dist/',
        ext: '.min.css'
      }
    },
    uglify: {
      dist: {
        files: {
          'dist/main.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },
    processhtml: {
      dist: {
        files: {
          'dist/index.html': ['src/index.html']
        }
      }
    },
    watch: {
      nunjucks: {
        files: 'src/templates/*',
        tasks: ['nunjucks']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-connect-rewrite');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-processhtml');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadTasks('./node_modules/grunt-nunjucks/tasks');

  grunt.registerTask('server',
    ['configureRewriteRules', 'connect:development']);
  grunt.registerTask('default',
    ['server', 'watch:nunjucks']);
  grunt.registerTask('minify',
    ['concat', 'cssmin', 'nunjucks', 'uglify', 'processhtml']);
};
