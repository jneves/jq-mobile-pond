/* Helper functions */

function alert_me(arg, text){
  json = filter_out_proxy(arg);
  alert(arg);
}

function filter_out_proxy(json) {
  return json.contents;
}

/* Cookie handling - from: http://www.quirksmode.org/js/cookies.html */

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

/* Data munching */

function preprocess(str) {
  res = str.replace(/(http:\/\/[a-zA-Z0-9\-_+?.\/#=,&]*)/g, "<a href=\"$1\">$1</a>");
  res = res.replace(/^(http:\/\/)([a-zA-Z0-9\-_+?,]+\.[a-zA-Z0-9\-_+?.]+\/[a-zA-Z0-9\-_+?./#=&]+)/g, "<a href=\"$1\">$1</a>");
  res = res.replace(/(^|[^a-zA-Z])@([a-zA-Z_\-@,0-9.]+)/g, " <a href=\"https://twitter.com/$2\">@$2</a>");
  res = res.replace(/(^|[^a-zA-Z])#([a-zA-Z_\-@,0-9]+)/g, " <a href=\"https://twitter.com/search?q=$2\">#$2</a>");
  return res;
}

function write_timeline(arg, text) {
  json = filter_out_proxy(arg);
  $("div#content").html("<ul id=\"timeline\" data-role=\"listview\" class=\"ui-listview\" role=\"listbox\"><li>Loading...</li></ul>");
  $("ul#timeline").html("");
  for (ev in json.Response.Events) {
    $("ul#timeline").append("<li class=\"ui-li ui-li-static ui-btn-up-c\" id=\""+json.Response.Events[ev].Event.EventID+"\"role=\"option\"><img src=\""+json.Response.Events[ev].Event.AvatarURL+"\" /><p class=\"username\">"+json.Response.Events[ev].Event.Name+"</p><p class=\"content\">"+ preprocess(json.Response.Events[ev].Event.TruncatedData) +"</p></li>");
  }
}


/* Pond API calls */

function call_pond(service, args, callback){
  pond_authcode = readCookie("pond_auth");
  if (!pond_authcode) {
    return false;
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

function update_timeline() {
  call_pond("ListEventsJSON",{OnlyUnRead: "true"}, write_timeline);
}

function mark_all_read() {
  $("ul#timeline li").each(
    function() {
      call_pond("SetEventReadJSON",{EventIDs: $(this).attr("id")}, update_timeline);
    }
  );
}

function login_res(json, text){
  if (json.status.http_code == 200) {
    createCookie("pond_auth", json.contents.Response.AuthToken, 0.4);
    update_timeline();
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

/* Initialization */

$(document).ready(function() {
  update_timeline();
});

