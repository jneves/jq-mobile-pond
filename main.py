#!/usr/bin/env python
import os

from google.appengine.ext import webapp
from google.appengine.ext.webapp import util

from google.appengine.api import urlfetch


class MainHandler(webapp.RequestHandler):
    def get(self):
        path = os.path.join(os.path.dirname(__file__), 'index.html')        
	self.response.out.write(open(path, 'r').read())

        
def main():
    application = webapp.WSGIApplication([('/', MainHandler)],  
                                         debug=True)
    util.run_wsgi_app(application)


if __name__ == '__main__':
    main()
