if(!settings.multipleView) settings.batchView=false;
settings.tex="pdflatex";
defaultfilename="stack-sorting-16";
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

size(12cm);

picture body;
pen border = black+1.2;
path outline = (0,0)..(0.5,-0.1)..(0.9,0)..(0.9,0)..(1,0.7)
..(0.85,1.3)..(0.4,1.32)..(0.13,1.1)..(0.12,1.08)--(0.12,1.08)..(0.03,0.4)
..(0,0.1)--(0,0.02)--(0,0)..cycle;
filldraw(body, (0.8,0.7)--(1.15,0.35)--(0.85,0.4)--cycle, rgb("#90a0b0"), border);
filldraw(body, outline, rgb("#90a0b0"), border);
filldraw(body, subpath(outline, 0.2, 6.6)
--(0.25,0.9)..(0.25,0.7)--(0.44,0.52)--(0.27,0.45)
..(0.2,0.22)..(0.15,0.1)..cycle,
rgb("#f4f4f4"), border);
filldraw(body, ellipse((0.32,-0.075), 0.12, 0.07), orange, border);
filldraw(body, ellipse((0.72,-0.07), 0.12, 0.07), orange, border);
draw(body, (0.51,1.07)..(0.59,1.09)..(0.66,1.07), black+1.5);
draw(body, (0.78,1.07)..(0.86,1.09)..(0.94,1.07), black+1.5);
filldraw(body, (0.7,0.98)--(0.89,0.92)--(0.68,0.89)--cycle, yellow, border);

picture body1;
picture body2;
picture body3;
picture body4;
add(body1,shift(0.5 - 0.1,0.18)*xscale(-0.9)*yscale(0.9)*body);
add(body2,shift(0.5 - 0.03,0.22)*xscale(-1.0)*yscale(1.1)*body);
add(body3,shift(0.5 + 0.03,0.24)*xscale(-1.1)*yscale(1.3)*body);
add(body4,shift(0.5 + 0.1,0.27)*xscale(-1.2)*yscale(1.5)*body);

// Numeral sizes are proportional to the penguins' vertical scales.
label(body1, "$\mathsf{1}$", (-0.11 - 0.1,0.6), fontsize(12pt)+red);
label(body2, "$\mathsf{2}$", (-0.15 - 0.03,0.8), fontsize(14.67pt)+red);
label(body3, "$\mathsf{3}$", (-0.25 + 0.03,0.9), fontsize(17.33pt)+red);
label(body4, "$\mathsf{4}$", (-0.32 + 0.1,1.0), fontsize(20pt)+red);

pen boxborder = deepgreen+2;

picture background;
draw(background, (-7,0)--(-1,0)--(-1,-5)--(1,-5)--(1,0)--(7,0), boxborder);
draw(background, (-8,-5)--(8,-5)--(8,3)--(-8,3)--cycle, invisible);

picture twoholebackground;
draw(twoholebackground,
(-11.75,0)--(-5.25,0)--(-5.25,-5)--(-3.25,-5)--(-3.25,0)
--(3.25,0)--(3.25,-5)--(5.25,-5)--(5.25,0)--(11.75,0),
boxborder);
draw(twoholebackground, (-12.5,-5)--(12.5,-5)--(12.5,3)--(-12.5,3)--cycle, invisible);

void placeontwohole(real offset) {
picture shifted;
add(shifted, shift(offset,0)*currentpicture);
erase();
add(shifted);
add(twoholebackground);
}

add(shift(-6.5,0)*body1);
add(shift(-3.5,0)*body3);
add(shift(-5,0)*body2);
add(shift(6.5,0)*body4);
placeontwohole(-4.25);
