all: swat noprefix

swat:
	cd vendors/swat && make
	cp vendors/swat/Swat.min.js vendors/Swat.min.js

noprefix:
	cd vendors/noprefix && make
	cp vendors/noprefix/NoPrefix.min.js vendors/NoPrefix.min.js

.PHONY: swat noprefix
