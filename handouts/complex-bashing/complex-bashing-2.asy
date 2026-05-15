if(!settings.multipleView) settings.batchView=false;
settings.tex="pdflatex";
defaultfilename="complex-bashing-2";
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
pair A = (-0.98,5.2);
pair B = (-2.74,0.);
pair C = (4.22,0.);
pair J = (-0.19206,1.82753);
pair D = (-0.19206,0.);
pair E = (1.10019,3.11980);
pair F = (-1.92314,2.41344);
pair A_1 = (1.67206,0.);
pair B_1 = (2.13980,2.08019);
pair C_1 = (-1.79685,2.78655);
pair X = (0.74,-2.16185);
pair Y = (3.48488,4.46488);
pair Z = (-2.93695,2.96450);
pair O = (0.74,1.72);

import graph;
pen zzttqq = rgb(0.6,0.2,0.);
pen cqcqcq = rgb(0.75294,0.75294,0.75294);
draw(A--B--C--cycle, linewidth(0.6) + zzttqq);

draw(A--B, linewidth(0.6) + zzttqq);
draw(B--C, linewidth(0.6) + zzttqq);
draw(C--A, linewidth(0.6) + zzttqq);
draw(circle(O, 3.88185), linewidth(0.6));
draw(circle(J, 1.82753), linewidth(0.6));
dot("$A$", A, dir(120));
dot("$B$", B, dir(240));
dot("$C$", C, dir(-30));
dot("$J$", J, dir(65));
dot("$D$", D, dir(-90));
dot("$E$", E, dir(64));
dot("$F$", F, dir(160));
dot("$A_1$", A_1, dir(-90));
dot("$B_1$", B_1, dir(63));
dot("$C_1$", C_1, dir(120));
dot("$X$", X, dir(-90));
dot("$Y$", Y, dir(50));
dot("$Z$", Z, dir(170));
dot("$O$", O, dir(63));
