LESSC = lessc

all: style.css

%.css: %.less
	$(LESSC) - < $^ > $@
