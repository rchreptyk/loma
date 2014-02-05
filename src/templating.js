define('templating', ['utils'], function(utils) {
  function render(name, ctx, cb) {
    if (typeof ctx === 'function') {
      cb = ctx;
      ctx = {};
    }
    return env.render(name + '.html', ctx, function(err, res) {
      if (err) {
        return console.error(err);
      }
      cb(res);
    });
  }

  var SafeString = nunjucks.require('runtime').SafeString;
  var env = nunjucks.configure('src/templates', {autoescape: true});
  var envGlobals = nunjucks.require('globals');
  var filters = nunjucks.require('filters');

  env.addFunction = function(name, func) {
    envGlobals[name] = func;
  };

  env.makeSafe = function(func) {
    return function() {
      return new SafeString(func.apply(this, arguments));
    };
  };

  filters.format = utils.format;

  function _l(str, id, opts) {
    // For pluralisation.
    var pluralOpts = {};
    if (opts && 'n' in opts) {
      pluralOpts = {n: opts.n};
    }
    // Use webL10n to localise.
    str = _(id, pluralOpts) || str;
    return opts ? filters.format(str, opts) : str;
  }

  env.addFunction('_', env.makeSafe(_l));

  return {
    _l: _l,
    env: env,
    render: render
  };
});