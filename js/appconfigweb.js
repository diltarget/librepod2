
var size = {
  width: window.innerWidth || document.body.clientWidth,
  height: window.innerHeight || document.body.clientHeight
}
var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({ el: $('#paper'), width: $('#paper').width, height: $('#paper').height, gridSize: 1, model: graph });

var activeCell;

// Create a custom element.
// ------------------------

function updateParm(){
	activeCell.attributes.attrs.parm[parseInt(this.id)] = this.value;
}

joint.shapes.html = {};
joint.shapes.html.Element = joint.shapes.basic.Rect.extend({
    defaults: joint.util.deepSupplement({
        type: 'html.Element',
        attrs: {
            rect: { stroke: 'none', 'fill-opacity': 0 }
        }
    }, joint.shapes.basic.Rect.prototype.defaults)
});

// Create a custom view for that element that displays an HTML div above it.
// -------------------------------------------------------------------------

joint.shapes.html.ElementView = joint.dia.ElementView.extend({

    template: [
        '<div class="html-element">',
        '<button class="delete">x</button>',
        '<label></label>',
        '<span></span>', '<br/>',
        '<input type="text" style="width:80px" />',
        '</div>'
    ].join(''),

    initialize: function() {
        _.bindAll(this, 'updateBox');
        joint.dia.ElementView.prototype.initialize.apply(this, arguments);

        this.$box = $(_.template(this.template)());
        // Prevent paper from handling pointerdown.
        this.$box.find('input,select').on('mousedown click', function(evt) { evt.stopPropagation(); });
        // This is an example of reacting on the input change and storing the input data in the cell model.
        this.$box.find('input').on('change', _.bind(function(evt) {
            this.model.set('input', $(evt.target).val());
        }, this));
        this.$box.find('select').on('change', _.bind(function(evt) {
            this.model.set('select', $(evt.target).val());
        }, this));
        this.$box.find('select').val(this.model.get('select'));
        this.$box.find('.delete').on('click', _.bind(this.model.remove, this.model));
        // Update the box position whenever the underlying model changes.
        this.model.on('change', this.updateBox, this);
        // Remove the box when the model gets removed from the graph.
        this.model.on('remove', this.removeBox, this);

        this.updateBox();
    },
    render: function() {
        joint.dia.ElementView.prototype.render.apply(this, arguments);
        this.paper.$el.prepend(this.$box);
        this.updateBox();
        return this;
    },
    updateBox: function() {
        // Set the position and dimension of the box so that it covers the JointJS element.
        var bbox = this.model.getBBox();
        // Example of updating the HTML with a data stored in the cell model.
        this.$box.find('label').text(this.model.get('label'));
        this.$box.find('span').text(this.model.get('select'));
        this.$box.css({ width: bbox.width, height: bbox.height, left: bbox.x, top: bbox.y, transform: 'rotate(' + (this.model.get('angle') || 0) + 'deg)' });
    },
    removeBox: function(evt) {
        this.$box.remove();
    }
});

// Create JointJS elements and add them to the graph as usual.
// -----------------------------------------------------------

var el1 = new joint.shapes.html.Element({ position: { x: 80, y: 80 }, size: { width: 100, height: 75 }, label: 'I am HTML', select: 'one' });
var el2 = new joint.shapes.html.Element({ position: { x: 370, y: 160 }, size: { width: 100, height: 75 }, label: 'Me too', select: 'two' });

paper.on('cell:pointerup', function(cellView, evt, x, y) {

    // Find the first element below that is not a link nor the dragged element itself.
    var elementBelow = graph.get('cells').find(function(cell) {
        if (cell instanceof joint.dia.Link) return false; // Not interested in links.
        if (cell.id === cellView.model.id) return false; // The same element as the dropped one.
        if (cell.getBBox().containsPoint(g.point(x, y))) {
            return true;
        }
        return false;
    });
    
    // If the two elements are connected already, don't
    // connect them again (this is application specific though).
    //console.log(graph.getNeighbors(elementBelow));
    if (elementBelow && !_.contains(graph.getNeighbors(elementBelow), cellView.model)) {
        
        graph.addCell(new joint.dia.Link({
            source: { id: cellView.model.id }, target: { id: elementBelow.id },
            attrs: { '.marker-source': { d: 'M 10 0 L 0 5 L 10 10 z' } }
        }));
        // Move the element a bit to the side.
        cellView.model.translate(0, 100);
    }
});

paper.on('cell:pointerdown', 
    function(cellView, evt, x, y) { 
		if(!cellView.model.attributes.attrs.header)return;
		//console.log(cellView.model.attributes.attrs.header);
        //console.log('cell view ' + cellView.model.id + ' was clicked'); 
        $("#editor").empty();
        
        cellView.model.attributes.attrs.header.forEach(function(e,q){
			console.log(e instanceof Array);
			var inp;
			if(e instanceof Array){
				inp = document.createElement("select");
				e.forEach(function(k){
					var a = document.createElement("option");
					a.value = k;
					a.innerHTML = k;
					inp.appendChild(a);
				});
			}else{
				inp = document.createElement("input");
				inp.type = "text";
			}
			inp.id = q;
			inp.class = "ignore"
			inp.value = (cellView.model.attributes.attrs.parm[q]?cellView.model.attributes.attrs.parm[q]:"");
			inp.oninput = updateParm//(this.id,this.value)"
			$("#editor").append((e instanceof Array?"": e+" ")).append(inp).append("<br>");
			activeCell = cellView.model;
		});
        
    }
);

function register(name,data,out){

joint.shapes.html.Element = joint.shapes.basic.Rect.extend({
    defaults: joint.util.deepSupplement({
        type: 'html.Element',
        attrs: {
            rect: { stroke: 'none', 'fill-opacity': 0 },
            header:data,
            parm:[]
        }
    }, joint.shapes.basic.Rect.prototype.defaults)
});

// Create a custom view for that element that displays an HTML div above it.
// -------------------------------------------------------------------------

joint.shapes.html.ElementView = joint.dia.ElementView.extend({

    template: [
        '<div class="html-element">',
        '<button class="delete">x</button>',
        '<label></label>',
        '<span></span>', '<br/>',
        '</div>'
    ].join(''),

    initialize: function() {
		//console.log(this);
        _.bindAll(this, 'updateBox');
        joint.dia.ElementView.prototype.initialize.apply(this, arguments);
		//console.log(this.$box.find('input'));
        this.$box = $(_.template(this.template)());
        // Prevent paper from handling pointerdown.
        this.$box.find('input,select,.perm').on('mousedown click', function(evt) { evt.stopPropagation(); });
        // This is an example of reacting on the input change and storing the input data in the cell model.
        this.$box.find('input,.perm').on('change', _.bind(function(evt) {
            this.model.set('input', $(evt.target).val());
        }, this));
        this.$box.find('select').on('change', _.bind(function(evt) {
            this.model.set('select', $(evt.target).val());
        }, this));
        this.$box.find('select').val(this.model.get('select'));
        this.$box.find('.delete').on('click', _.bind(this.model.remove, this.model));
        // Update the box position whenever the underlying model changes.
        this.model.on('change', this.updateBox, this);
        // Remove the box when the model gets removed from the graph.
        this.model.on('remove', this.removeBox, this);

        this.updateBox();
    },
    render: function() {
        joint.dia.ElementView.prototype.render.apply(this, arguments);
        this.paper.$el.prepend(this.$box);
        this.updateBox();
        return this;
    },
    updateBox: function() {
        // Set the position and dimension of the box so that it covers the JointJS element.
        var bbox = this.model.getBBox();
        // Example of updating the HTML with a data stored in the cell model.
        this.$box.find('label').text(this.model.get('label'));
        this.$box.find('span').text(this.model.get('select'));
        this.$box.css({ width: bbox.width, height: bbox.height, left: bbox.x, top: bbox.y, transform: 'rotate(' + (this.model.get('angle') || 0) + 'deg)' });
    },
    removeBox: function(evt) {
        this.$box.remove();
    }
});

graph.addCell(new joint.shapes.html.Element({ position: { x: 80, y: 80 }, size: { width: 100, height: 75 }, label: name, select: '' }));

}

$("#selector").append("<br>").append($('<button class="button" type="button"/>').text("run").click(function(){
	register("run",[])
}));

$("#selector").append("<br>").append($('<button class="button" type="button"/>').text("DEBUG").click(function(){
	register("DEBUG",[])
}));

$.getJSON('/api/interfaces', function(data) {
	header_data = data;
    $.each(data,function(i,item){
		$("#selector").append("<br>").append($('<button class="button" type="button"/>').text(i).click(function(){
			register(i,item[0],item[1]);
		}));
	});
});

var socket = io.connect("http://localhost:8001");

socket.on("debug",function(data){
	console.log(data);
});

function save(){
	window.prompt("Name?");
	socket.emit("save",{links:graph.getLinks(),elements:graph.getElements()});
}
