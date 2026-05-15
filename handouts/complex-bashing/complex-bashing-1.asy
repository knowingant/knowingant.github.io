if(!settings.multipleView) settings.batchView=false;
settings.tex="pdflatex";
defaultfilename="complex-bashing-1";
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
pair A = (-5.90607,6.08410);
pair B = (-7.8,-2.03);
pair C = (4.88,-2.21);
pair I = (-4.05446,0.89888);
pair K = (-3.81141,-2.08662);
pair P = (-6.14582,-0.24847);
pair Q = (5.35711,-9.30601);
pair R = (-1.12284,1.32782);
pair S = (-8.74722,-8.35503);

import graph;
pen rvwvcq = rgb(0.08235,0.39607,0.75294);
pen wewdxt = rgb(0.43137,0.42745,0.45098);
draw(A--B--C--cycle, linewidth(0.6) + rvwvcq);
draw(A--B, linewidth(0.6) + rvwvcq);
draw(B--C, linewidth(0.6) + rvwvcq);
draw(C--A, linewidth(0.6) + rvwvcq);
draw(circle((-1.51797,-6.20422), 7.54241), linewidth(0.6) + wewdxt);
draw(A--K, linewidth(0.6) + wewdxt);
draw(P--Q, linewidth(0.6) + wewdxt);
draw(R--S, linewidth(0.6) + wewdxt);

dot("$A$", A, dir(90));
dot("$B$", B, dir(150));
dot("$C$", C, dir(60));
dot("$I$", I, dir(90));
dot("$K$", K, dir(270));
dot("$P$", P, dir(150));
dot("$Q$", Q, dir(330));
dot("$R$", R, dir(100));
dot("$S$", S, dir(210));
