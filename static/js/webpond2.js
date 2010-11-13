var updating = false;
var update_next = false;

/* Cookie functions from http://www.quirksmode.org/js/cookies.html*/

function createCookie(name,value,days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires="+date.toGMTString();
	}
	else var expires = "";
	document.cookie = name+"="+value+expires+"; path=/";
}

function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}

function eraseCookie(name) {
	createCookie(name,"",-1);
}

/* Helper functions */

function alert_me(arg, text){
  json = filter_out_proxy(arg);
  alert(arg);
}

function filter_out_proxy(json) {
  return json.contents;
}

/* Data munching */

function preprocess(str) {
  res = str;
  //res = res.replace(/\&/g, "&amp;");
  //res = res.replace(/\</g, "&lt;");
  //res = res.replace(/\>/g, "&gt;");
  //res = res.replace(/\"/g, "&quot;");
  //res = res.replace(/(http:\/\/[a-zA-Z0-9\-_+?.\/#=,&\:]*)/g, "<a href=\"$1\" target=\"_blank\">$1</a>");
  //res = res.replace(/^(http:\/\/)([a-zA-Z0-9\-_+?,]+\.[a-zA-Z0-9\-_+?.\:]+\/[a-zA-Z0-9\-_+?./#=&]+)/g, "<a href=\"$1\" target=\"_blank\">$1</a>");
  res = res.replace(/(^|[^a-zA-Z])@([a-zA-Z_\-@,0-9.]+)/g, " <a href=\"https://twitter.com/$2\" target=\"_blank\">@$2</a>");
  res = res.replace(/(^|[^a-zA-Z])#([a-zA-Z_\-@,0-9]+)/g, " <a href=\"https://twitter.com/search?q=$2\" target=\"_blank\">#$2</a>");
  return res;
}

function write_timeline(arg, text) {
  //json = filter_out_proxy(arg);
  json = arg;
  if (json.status.http_code != 200 ) {
    alert("Pond is down!");
  } else {
    $("ul#timeline").html("");
    for (ev in json.contents.Response.Events) {
      $("ul#timeline").append("<li class=\"ui-li ui-li-static ui-btn-up-c mine\" id=\""+json.contents.Response.Events[ev].Event.EventID+"\"ole=\"option\"><img src=\""+json.contents.Response.Events[ev].Event.AvatarURL+"\" /><p class=\"username\">"+json.contents.Response.Events[ev].Event.Name+"</p><p class=\"content\">"+ preprocess(json.contents.Response.Events[ev].Event.TruncatedData) +"</p></li>");
    }
  }
  updating = false;
  if (update_next) {
    update_timeline();
  }
 }


function call_pond(service, args, callback) {
  pond_authcode = readCookie("pond_auth");
  if (!pond_authcode || pond_authcode == "") {
    window.location.href = "/";
  }
  url = 'https://services.sapo.pt/Pond/' + service + "?AuthToken=" + pond_authcode;
  if (args) {
    for (i in args) {
      url += "&" + i + "=" + args[i];
    }
  }
  $.ajax({
    url: 'proxy.php',
    dataType: 'json',
    data: { url: url },
    success: callback
  });
}

function call_pond_1_1(service, args, callback) {
  pond_authcode = readCookie("pond_auth");
  if (!pond_authcode || pond_authcode == "") {
    window.location.href = "/";
  }
  url = 'https://services.sapo.pt/Pond/v1_1/' + service + "?AuthToken=" + pond_authcode;
  if (args) {
    for (i in args) {
      url += "&" + i + "=" + args[i];
    }
  }
  $.ajax({
    url: 'proxy.php',
    dataType: 'json',
    data: { url: url },
    success: callback
  });
}

function update_timeline(status) {
  arg = {OnlyUnRead: "true"};
  if (status == "all") {
    arg = {};
  } else if (status == "starred") {
    arg = {OnlyFavorites: "true"};
  }
  if (!updating) {
    update_next = false;
    updating = true;
    call_pond_1_1("ListEventsJSON", arg, write_timeline);
  } else {
    update_next = true;
  }
}

function mark_all_read() {
  $("ul#timeline li").each(
    function() {
      call_pond("SetEventReadJSON",{EventIDs: $(this).attr("id")}, update_timeline);
    }
  );
  return false;
}

function logout_pond() {
  alert("logout_pond()");
  eraseCookie("pond_auth");
  window.location.href = "/";
  return false;
}

function login_res(json, text){
  if (json.contents.Result.Status == "200") {
    createCookie("pond_auth", json.contents.Response.AuthToken, 0.4);
    window.location.href = "timeline.html";
  } else {
    window.location.href = "/";
  }
}

function auth(){
  url = 'https://services.sapo.pt/Pond/GetAuthTokenJSON';
  url += "?Username="+$("#username").val()+"&Password="+$("#password").val();
  $.ajax({
    url: 'proxy.php',
    dataType: 'json',
    data: { url: url },
    success: login_res
  });
  return false;
}


