import{a4 as e,u as t,r as n,g as o,a5 as s,s as r,j as l,e as i,G as a,I as c,J as u,a6 as d,O as g,Q as p,$ as f,a7 as m}from"./index-BAeg54_S.js";import{L as x}from"./LexicalNestedComposer-ay-OKJoQ.js";const y={...e,paragraph:"StickyEditorTheme__paragraph"};function v(e,t){const n=e.style,o=t.rootElementRect,s=null!==o?o.left:0,r=null!==o?o.top:0;n.top=r+t.y+"px",n.left=s+t.x+"px"}function E({x:e,y:E,nodeKey:h,color:j,caption:R}){const[b]=t(),C=n.useRef(null),L=n.useRef({isDragging:!1,offsetX:0,offsetY:0,rootElementRect:null,x:0,y:0}),{isCollabActive:k}=o();n.useEffect((()=>{const t=L.current;t.x=e,t.y=E;const n=C.current;null!==n&&v(n,t)}),[e,E]),s((()=>{const e=L.current,t=new ResizeObserver((t=>{for(let n=0;n<t.length;n++){const o=t[n],{target:s}=o;e.rootElementRect=s.getBoundingClientRect();const r=C.current;null!==r&&v(r,e)}})),n=b.registerRootListener(((e,n)=>{null!==n&&t.unobserve(n),null!==e&&t.observe(e)})),o=()=>{const t=b.getRootElement(),n=C.current;null!==t&&null!==n&&(e.rootElementRect=t.getBoundingClientRect(),v(n,e))};return window.addEventListener("resize",o),()=>{window.removeEventListener("resize",o),n()}}),[b]),n.useEffect((()=>{const e=C.current;null!==e&&setTimeout((()=>{e.style.setProperty("transition","top 0.3s ease 0s, left 0.3s ease 0s")}),500)}),[]);const N=e=>{const t=C.current,n=L.current,o=n.rootElementRect,s=i(t);null!==t&&n.isDragging&&null!==o&&(n.x=e.pageX/s-n.offsetX-o.left,n.y=e.pageY/s-n.offsetY-o.top,v(t,n))},D=e=>{const t=C.current,n=L.current;null!==t&&(n.isDragging=!1,t.classList.remove("dragging"),b.update((()=>{const e=f(h);m(e)&&e.setPosition(n.x,n.y)}))),document.removeEventListener("pointermove",N),document.removeEventListener("pointerup",D)},{historyState:w}=r();return l.jsx("div",{ref:C,className:"sticky-note-container",children:l.jsxs("div",{className:`sticky-note ${j}`,onPointerDown:e=>{const t=C.current;if(null==t||2===e.button||e.target!==t.firstChild)return;const n=t,o=L.current;if(null!==n){const{top:t,left:s}=n.getBoundingClientRect(),r=i(n);o.offsetX=e.clientX/r-s,o.offsetY=e.clientY/r-t,o.isDragging=!0,n.classList.add("dragging"),document.addEventListener("pointermove",N),document.addEventListener("pointerup",D),e.preventDefault()}},children:[l.jsx("button",{onClick:()=>{b.update((()=>{const e=f(h);m(e)&&e.remove()}))},className:"delete","aria-label":"Delete sticky note",title:"Delete",children:"X"}),l.jsx("button",{onClick:()=>{b.update((()=>{const e=f(h);m(e)&&e.toggleColor()}))},className:"color","aria-label":"Change sticky note color",title:"Color",children:l.jsx("i",{className:"bucket"})}),l.jsxs(x,{initialEditor:R,initialTheme:y,children:[k?l.jsx(a,{id:R.getKey(),providerFactory:c,shouldBootstrap:!0}):l.jsx(u,{externalHistoryState:w}),l.jsx(d,{contentEditable:l.jsx(g,{placeholder:"What's up?",placeholderClassName:"StickyNode__placeholder",className:"StickyNode__contentEditable"}),ErrorBoundary:p})]})]})})}export{E as default};
