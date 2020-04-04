.PHONY: all clean

all: ../src/styles/assets/foo.bin.br

../src/styles/assets/foo.bin: 160925_oirase_chosifalls_local4cm.asc convert.py
	./convert.py $< $@

../src/styles/assets/foo.bin.br: ../src/styles/assets/foo.bin
	brotli -fZ $^

clean:
	-rm ../src/styles/assets/foo.bin*
