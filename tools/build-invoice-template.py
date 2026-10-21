# Membuat template latar invoice (teks dinamis ditutup) dari design/Invoice_Indo___English.pdf.
# Butuh: python3, pikepdf, poppler (pdftoppm). Jalankan dari akar proyek: mkdir -p tools/out && python3 tools/build-invoice-template.py
# Lalu: pdftoppm -r 300 -jpeg -jpegopt quality=92 tools/out/bg-id.pdf x  -> salin ke admin/invoice-assets/bg-id.jpg (idem EN).
# Catatan: koordinat memakai selisih MediaBox PDF (7.92 pt) -> H=870.
import pikepdf
from pikepdf import Pdf, Name, Dictionary, Array
H=870.0
# daerah dinamis (pt, origin kiri-atas): (x0,top,x1,bottom,warna)
W=(1,1,1); K=(0,0,0)
common_white=[(390,219.4,412,224),(180,204,272,253),(404,204,540,222),(385,220,540,266),(60,305,540,548),(60,659,540,696)]
ID=common_white+[(290,584,400,607),(425,556,524,607),(166,585,288,634),(275,732,360,748),(270,786,365,804)]
EN=common_white+[(338,584,424,607),(447,556,524,607),(166,585,340,634),(275,732,360,748),(265,786,370,804)]
ID_black=[(433,622,523,646)]; EN_black=[(449,624,523,646)]
def ops(white,black):
    s="q\n"
    for (x0,t,x1,b) in white: s+=f"1 1 1 rg {x0} {H-b} {x1-x0} {b-t} re f\n"
    for (x0,t,x1,b) in black: s+=f"0 0 0 rg {x0} {H-b} {x1-x0} {b-t} re f\n"
    return s+"Q\n"
src=Pdf.open("design/Invoice_Indo___English.pdf")
for i,(w,b) in enumerate([(ID,ID_black),(EN,EN_black)]):
    pdf=Pdf.open("design/Invoice_Indo___English.pdf")
    # simpan hanya halaman i
    for j in reversed(range(len(pdf.pages))):
        if j!=i: del pdf.pages[j]
    pg=pdf.pages[0]
    pre=pdf.make_stream(b"q\n"); post=pdf.make_stream(("Q\n"*24+ops(w,b)).encode())
    c=pg.obj.Contents
    arr=[pre]+(list(c) if isinstance(c,Array) else [c])+[post]
    pg.obj.Contents=Array(arr)
    pdf.save(f"tools/out/bg-{['id','en'][i]}.pdf")
print("ok")
