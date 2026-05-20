if(!settings.multipleView) settings.batchView=false;
settings.tex="pdflatex";
defaultfilename="algebraic-nt-2";
if(settings.render < 0) settings.render=4;
settings.outformat="";
settings.inlineimage=true;
settings.embed=true;
settings.toolbar=false;
viewportmargin=(2,2);

defaultpen(fontsize(10pt));
size(8cm); // set a reasonable default
usepackage("amsmath");
usepackage("amssymb");
settings.tex="pdflatex";
settings.outformat="pdf";
// Replacement for olympiad+cse5 which is not standard
import geometry;
// recalibrate fill and filldraw for conics
void filldraw(picture pic = currentpicture, conic g, pen fillpen=defaultpen, pen drawpen=defaultpen)
{ filldraw(pic, (path) g, fillpen, drawpen); }
void fill(picture pic = currentpicture, conic g, pen p=defaultpen)
{ filldraw(pic, (path) g, p); }
// some geometry
pair foot(pair P, pair A, pair B) { return foot(triangle(A,B,P).VC); }
pair centroid(pair A, pair B, pair C) { return (A+B+C)/3; }
// cse5 abbreviations
path CP(pair P, pair A) { return circle(P, abs(A-P)); }
path CR(pair P, real r) { return circle(P, r); }
pair IP(path p, path q) { return intersectionpoints(p,q)[0]; }
pair OP(path p, path q) { return intersectionpoints(p,q)[1]; }
path Line(pair A, pair B, real a=0.6, real b=a) { return (a*(A-B)+A)--(b*(B-A)+B); }
// cse5 more useful functions
picture CC() {
picture p=rotate(0)*currentpicture;
currentpicture.erase();
return p;
}
pair MP(Label s, pair A, pair B = plain.S, pen p = defaultpen) {
Label L = s;
L.s = "$"+s.s+"$";
label(L, A, B, p);
return A;
}
pair Drawing(Label s = "", pair A, pair B = plain.S, pen p = defaultpen) {
dot(MP(s, A, B, p), p);
return A;
}
path Drawing(path g, pen p = defaultpen, arrowbar ar = None) {
draw(g, p, ar);
return g;
}

/*
Converted from GeoGebra by User:Azjps using Evan's magic cleaner
https://github.com/vEnhance/dotfiles/blob/main/py-scripts/export-ggb-clean-asy.py
*/
pair A = (2.91045,6.51950);
pair B = (-0.67125,-8.05578);
pair C = (16.4448,-8.06352);
pair D = (1.93054,-6.67922);
pair Dp = (-0.12974,-34.43009);
pair E = (5.14541,-4.97830);
pair Ep = (-0.62449,-10.33329);
pair M = (7.88677,-8.05965);

import graph;
size(10cm);
pen zzttqq = rgb(0.6,0.2,0.);
pen cqcqcq = rgb(0.75294,0.75294,0.75294);
pen svsvsv = rgb(0.14509,0.14509,0.14509);
draw(A--B--C--cycle, linewidth(0.6) + zzttqq);

draw(A--B, linewidth(0.6) + zzttqq);
draw(B--C, linewidth(0.6) + zzttqq);
draw(C--A, linewidth(0.6) + zzttqq);
draw(circle((7.88089,-21.07290), 15.57513), linewidth(0.6));
draw(A--Dp, linewidth(0.6));
draw(Ep--(9.67762,-0.77200), linewidth(0.6));
draw(B--Dp, linewidth(0.6));
draw(B--E, linewidth(0.6));
dot("$A$", A, dir(12));
dot("$B$", B, dir(135));
dot("$C$", C, dir(66));
dot("$D$", D, dir(135));
dot("$D'$", Dp, dir(30));
dot("$E$", E, dir(135));
dot("$E'$", Ep, dir(190));
dot("$M$", M, dir(-90));
