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

/* from http://stackoverflow.com/questions/901115/get-querystring-values-with-jquery */

function getParameterByName( name )
{
  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  var regexS = "[\\?&]"+name+"=([^&#]*)";
  var regex = new RegExp( regexS );
  var results = regex.exec( window.location.href );
  if( results == null )
    return "";
  else
    return decodeURIComponent(results[1].replace(/\+/g, " "));
}

/* Data munching */

function preprocess(str) {
  res = str;
  //res = res.replace(/\&/g, "&amp;");
  //res = res.replace(/\</g, "&lt;");
  //res = res.replace(/\>/g, "&gt;");
  //res = res.replace(/\"/g, "&quot;");
  res = res.replace(/ href=\"/g, "target=\"_blank\" href=\"");
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
      img_class = "class=\"avatar\"";
      extra_class = "";
      if (json.contents.Response.Events[ev].Event.Mine == "true") {
        img_class = "class=\"avatar mine\"";
        extra_class = "mine";
      }
      thumbnail = "";
      if (json.contents.Response.Events[ev].Event.Thumbnail != "") {
        thumbnail = "<p id=\"thumbnail\"><img src=\""+json.contents.Response.Events[ev].Event.Thumbnail+"\" /></p>";
      }
      $("ul#timeline").append("<li class=\"ui-li ui-li-static ui-btn-up-c "+extra_class+"\" id=\""+json.contents.Response.Events[ev].Event.EventID+"\"ole=\"option\"><img src=\""+json.contents.Response.Events[ev].Event.AvatarURL+"\" "+img_class+" /><p class=\"details\"><a href=\"event.html?event_id="+json.contents.Response.Events[ev].Event.EventID+"\" rel=\"external\" data-role=\"button\" data-icon=\"arrow-r\" data-iconpos=\"notext\" class=\"ui-btn ui-btn-icon-notext ui-btn-corner-all ui-shadow ui-btn-up-c\"><span class=\"ui-btn-inner ui-btn-corner-all\"><span class=\"ui-btn-text\">More details</span><span class=\"ui-icon ui-icon-arrow-r ui-icon-shadow\"></span></span></a></p><p class=\"username\">"+json.contents.Response.Events[ev].Event.Name+"</p><p class=\"content\">"+ preprocess(json.contents.Response.Events[ev].Event.TruncatedData) +"</p>"+thumbnail+"</li>");
    }
  }
  updating = false;
  if (update_next) {
    update_timeline();
  }
 }


function write_event(arg, text) {
  //json = filter_out_proxy(arg);
  json = arg;
  if (json.status.http_code != 200 ) {
    alert("Pond is down!");
  } else {
    $("div#event_content").html("");
    for (ev in json.contents.Response.Events) {
      $("div#event_content").append("<img src=\""+json.contents.Response.Events[ev].Event.AvatarURL+"\" /><p class=\"username\">"+json.contents.Response.Events[ev].Event.Name+"</p><p class=\"content\">"+ preprocess(json.contents.Response.Events[ev].Event.Data.Title) + preprocess(json.contents.Response.Events[ev].Event.Data.Content) + preprocess(json.contents.Response.Events[ev].Event.Data.Summary)+"</p><div class=\"ui-grid-a\"><div class=\"ui-block-a\"><a href=\"#\" onclick=\"retweet("+json.contents.Response.Events[ev].Event.ID+","+json.contents.Response.Events[ev].Event.Data.Content+")\" data-role=\"button\">Retweet</a></div><div class=\"ui-block-b\"><a href=\"#\" onclick=\"reply("+json.contents.Response.Events[ev].Event.ID+","+json.contents.Response.Events[ev].Event.Data.Content+")\" data-role=\"button\">Reply</a></div></div><a href=\"#\" onclick=\"mark_read("+json.contents.Response.Events[ev].Event.ID+")\" data-role=\"button\">Reply</a>");
    }
  }
 }

function reply(id, content) {
  call_pond("ReplyToEventJSON", {InReplyToEvent: id, SmallText: content}, function(){ alert("Posted reply!")});
}

function post(account, content) {
  call_pond("ReplyToEventJSON", {SmallText: content, AccountID: account}, function(){ alert("Posted reply!")});

}

function mark_read(id) {
  call_pond("SetEventReadJSON",{EventIDs: id}, function(){ alert("Marked as read!")});
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

function load_event() {
  event = getParameterByName("event_id");
  call_pond_1_1("GetEventJSON", {EventIDs: event}, write_event);
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


