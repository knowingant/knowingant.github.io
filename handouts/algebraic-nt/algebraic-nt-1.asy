if(!settings.multipleView) settings.batchView=false;
settings.tex="pdflatex";
defaultfilename="algebraic-nt-1";
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

defaultpen(fontsize(11pt));
size(10cm);
import graph;
graph.xaxis("Re", -1.5, 1.5, Arrows);
graph.yaxis("Im", -1.5, 1.5, Arrows);
label("$0$", origin, dir(-45));

real markersize = 0.05;

int roottype(int k) {
if (k == 0) return 1;
if (k == 6) return 2;
if (k == 4 || k == 8) return 3;
if (k == 3 || k == 9) return 4;
if (k == 2 || k == 10) return 5;
return 6;
}

void mark(pair p, int t) {
pen drawpen = black + linewidth(0.8);
if (t == 1) {
filldraw(circle(p, markersize), white, drawpen);
} else if (t == 2) {
filldraw(circle(p, markersize), black, drawpen);
} else if (t == 3) {
pair[] tri = {
p + markersize * dir(90),
p + markersize * dir(210),
p + markersize * dir(330)
};
filldraw(tri[0] -- tri[1] -- tri[2] -- cycle, white, drawpen);
} else if (t == 4) {
pair[] tri = {
p + markersize * dir(90),
p + markersize * dir(210),
p + markersize * dir(330)
};
filldraw(tri[0] -- tri[1] -- tri[2] -- cycle, black, drawpen);
} else if (t == 5) {
filldraw(box(p - (markersize, markersize), p + (markersize, markersize)),
white, drawpen);
} else {
filldraw(box(p - (markersize, markersize), p + (markersize, markersize)),
black, drawpen);
}
}

pair labeldir(int k) {
if (k == 0 || k == 3) return dir(45);
if (k == 6) return dir(135);
if (k == 9) return dir(-45);
return dir(30 * k);
}

draw(unitcircle);
pair[] z = new pair[12];
for (int k = 0; k < 12; ++k) {
z[k] = dir(30 * k);
mark(z[k], roottype(k));
label("$\zeta_{12}^{" + string(k) + "}$", 1.02 * z[k], labeldir(k));
}
int[] divisors = {1, 2, 3, 4, 6, 12};
for (int i = 0; i < divisors.length; ++i) {
pair p = (1.75, -0.4 - 0.2 * i);
mark(p, i + 1);
label("$\Phi_{" + string(divisors[i]) + "}$", p + (0.18, 0), dir(0));
}
