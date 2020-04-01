#!/usr/bin/env python3
import sys
import struct
from typing import List

RowStruct = struct.Struct("<eeeH")
FloatStruct = struct.Struct("<e")
ShortStruct = struct.Struct("<H")
IntStruct = struct.Struct("<I")


def rgb565(r: int, g: int, b: int) -> int:
    b = (b >> 3) & 0x1f
    g = ((g >> 2) & 0x3f) << 5
    r = ((r >> 3) & 0x1f) << 11
    return (r | g | b)


def main() -> None:
    buffer1: List[bytes] = []
    buffer2: List[bytes] = []

    xs: List[float] = []
    ys: List[float] = []
    zs: List[float] = []
    # rgbs: List[int] = []

    with open(sys.argv[1], "r") as f:
        for line in f.readlines():
            line = line.strip()
            parts = line.split()
            x, y, z = (float(x) for x in parts[:3])
            r, g, b = (int(x) for x in parts[3:6])

            buffer1.append(RowStruct.pack(x, y, z, rgb565(r, g, b)))

    buffer1.sort()

    for row in buffer1:
        x, y, z, rgb = RowStruct.unpack(row)
        xs.append(x)
        ys.append(y)
        zs.append(z)
        # rgbs.append(rgb)

    xs_bin = b"".join(FloatStruct.pack(x) for x in xs)
    ys_bin = b"".join(FloatStruct.pack(y) for y in ys)
    zs_bin = b"".join(FloatStruct.pack(z) for z in zs)
    # rgb_bin = b"".join(ShortStruct.pack(rgb) for rgb in rgbs)
    buffer2 = [b"SKNKPNTC", IntStruct.pack(len(xs)), xs_bin, ys_bin, zs_bin]

    with open(sys.argv[2], "wb") as fb:
        for part in buffer2:
            fb.write(part)


if __name__ == "__main__":
    main()
