all: swat noprefix

swat:
	cd swat && make
	cp swat/Swat.min.js vendor/Swat.min.js

noprefix:
	cd noprefix && make
	cp noprefix/NoPrefix.min.js vendor/NoPrefix.min.js

.PHONY: swat noprefix
