function ecco_hidden(){
    loop(document.body);
}

var is_hidden = false;
function loop(node){
    if ( node.localName != "script") {
        computed_style = window.getComputedStyle(node).display
        if ( computed_style == "hidden" || computed_style == "none" || node.hidden || node.style.visibility == "hidden" || node.style.display == "none") {
            node.setAttribute("ecco-attr", "ecco-hidden");
            is_hidden = true;
        }
        if( is_hidden == true ){
                node.setAttribute("ecco-attr", "ecco-hidden");
        }
    }
    var nodes = node.childNodes;
    for (var i = 0; i <nodes.length; i++){
        if(!nodes[i]){
            if( is_hidden == true ){
                nodes[i].setAttribute("ecco-attr", "ecco-hidden");
            }
        }
        if(nodes[i].childNodes.length > 0){
            loop(nodes[i]);
        }
    }
    if (node.parentNode.getAttribute("ecco-attr") == "ecco-hidden"){
        is_hidden = true;
    }
    else{
        is_hidden = false
    }
}