all: swat noprefix

swat:
	cd vendors/swat && make
	cp vendors/swat/Swat.min.js vendor/Swat.min.js

noprefix:
	cd vendors/noprefix && make
	cp vendors/noprefix/NoPrefix.min.js vendor/NoPrefix.min.js

.PHONY: swat noprefix
