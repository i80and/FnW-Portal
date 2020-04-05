.PHONY: all clean

all: ../src/styles/assets/choshi-otaki-falls.bin.br

../src/styles/assets/choshi-otaki-falls.bin: 160925_oirase_chosifalls_local4cm.asc convert.py
	./convert.py $< $@

../src/styles/assets/choshi-otaki-falls.bin.br: ../src/styles/assets/choshi-otaki-falls.bin
	brotli -fZ $^

clean:
	-rm ../src/styles/assets/choshi-otaki-falls.bin*
