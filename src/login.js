define('login',
       ['capabilities', 'log', 'dom', 'notification', 'templating', 'url', 'user'],
       function(capabilities, log, $, notification, templating, url, user) {
  if (!capabilities.persona) {
    return;
  }

  var console = log('login');

  var $signIn = $('.sign-in');
  var $signOut = $('.sign-out');

  var loginOpts = {
    oncancel: function() {
      console.log('Persona login cancelled');
    }
  };

  function signOutNotification() {
    notification.notification(
      templating._l('You have been signed out', 'signOutNotification'));
  }

  function signInNotification() {
    notification.notification(
      templating._l('You have been signed in', 'signInNotification'));
  }

  $.delegate('login', $.body, function() {
    console.log('Logged in');
    signInNotification();
    $.body.dataset.auth = 'true';
  });

  $.delegate('login_fail logout', $.body, function() {
    console.log('Logged out');
    $.body.dataset.auth = 'false';
  });

  $.delegate('click', '.login', function() {
    console.log('Logging user in');
    navigator.id.request(loginOpts);
  });

  $.delegate('click', '.sign-out', function() {
    console.log('Logging user out');
    navigator.id.logout();
    user.clearToken();
    logoutUser();
    signOutNotification();
  });

  navigator.id.watch({
    loggedInUser: user.getSetting('email'),
    onlogin: gotVerifiedEmail,
    onlogout: logoutUser
  });

  function logoutUser() {
    if ($.body.dataset.auth === 'true') {
      $.trigger($.body, 'logout');
    }
  }

  function loginSuccess(data, xhr) {
    // Assertion successfully verified, so let's log the user in.
    if (!user.loggedIn()) {
      user.setToken(data.token, data.settings);
      user.updatePermissions(data.permissions);
      console.log('Login succeeded; preparing the app');

      $.trigger($.body, 'login');

      templating.render('header', function(res) {
        $('.header').innerHTML = res;
      });
    } else {
      console.log('Reload on login aborted by current view');
    }
  }

  function loginError(data, xhr) {
    // TODO: Add error-handling notification (issue #39).
    console.warn('Assertion verification failed!', xhr.statusText, data);
    $.trigger($.body, 'login_fail');
  }

  function gotVerifiedEmail(assertion) {
    console.log('Got assertion from Persona');

    var data = {
      assertion: assertion,
      audience: window.location.origin,
      isMobile: capabilities.mobileLogin
    };

    $.post(url('login'), data).then(loginSuccess, loginError);
  }

  $.trigger($.body, user.loggedIn() ? 'login' : 'logout');
});
