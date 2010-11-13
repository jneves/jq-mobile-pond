#!/usr/bin/env python
import os

from google.appengine.ext import webapp
from google.appengine.ext.webapp import util

from google.appengine.api import urlfetch
import cgi
import urllib
 
class PondProxyController(webapp.RequestHandler):
	def get(self):
		result = urlfetch.fetch(url=self.request.GET.get('url'), method=urlfetch.GET)
		self.response.headers["Content-Type"] = "application/json"
		self.response.out.write('{"status": { "http_code":' + str(result.status_code) + ' }, "contents": ' + result.content + '}')

class MainHandler(webapp.RequestHandler):
    def get(self):
        path = os.path.join(os.path.dirname(__file__), 'index.html')        
	self.response.out.write(open(path, 'r').read())

        
def main():
    application = webapp.WSGIApplication([('/', MainHandler), 
					  ('/proxy.php', PondProxyController)],  
                                         debug=True)
    util.run_wsgi_app(application)


if __name__ == '__main__':
    main()
