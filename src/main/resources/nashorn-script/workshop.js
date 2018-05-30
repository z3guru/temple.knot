/**
 * Created by jaeda on 2017. 2. 17..
 */
//@sourceUrl

var __JAVA_TOOL = Java.type("guru.z3.temple.knot.nashorn.JavaTool");
var __LOGGER = __JAVA_TOOL.getLogger();

function expression(expr)
{
    //var regex = //;

}

var $knot = {
	BV: function(sz)
	{
        __LOGGER.debug("$knot:BV sz={}", sz);
        var buf = this.yarn.source(sz);
        var value = undefined;

		switch(sz)
		{
			case 1: value = buf.get();      break;
			case 2: value = buf.getShort(); break;
			case 4: value = buf.getInt();   break;
			case 8: value = buf.getLong();  break;
		}

        return value;
	}
	, HO: function(to)
    {
        __LOGGER.debug("$knot:HO to={}", to);
        this.workshop.handover(to);
    }

    , dummy: function(def, name)
    {
        __LOGGER.debug("dummy name={}", name);
    }

    , util: {
	    checkMin: function(min, value) {
            __LOGGER.debug("$knot:util:checkMin min={}, value={}", min, value);
	        if ( value < min ) throw "Underflow value=" + value + ", with min=" + min;
        }

        , ref: function(mem, name, value) {
            __LOGGER.debug("$knot:util:ref name={}, value={}", name, value);
        }
    }

    /**
     * move a value of "expr" into a message
     *
     * @param expr
     * @param sz        a count of bytes
     * @param format
     */
    , knit: function(expr, sz, format)
    {

    }
};

function __obj_code(craftsman, defs)
{
    //this.craftsman = craftsman;
    this.defs = defs;
    this.knots = [];

    for (var i = 0; i < defs.length; i++) {
        var knot = KnotHelper.compile(craftsman, defs[i])
        this.knots.push(knot);
    }

    this.execute = function()
    {
        for ( var i = 0; i < this.knots.length; i++ )
        {
            this.knots[i].execute();
        }
    }
}

var KnotHelper = {
    compile: function (craftsman, def) {
        var knot = new Knot();

        // 보조 함수들을 확인한다. ===================================
        if ( def.min !== undefined )
        {
            knot.logics.push($knot.util.checkMin.bind(knot, def.min))
        }

        if ( def.ref !== undefined )
        {
            knot.logics.push($knot.util.ref.bind(knot, craftsman.mem, def.ref))
        }

        switch (def.type) {
            case "BV":
                knot.parse = $knot.BV.bind(craftsman, def.size);
                break;

            case "HO":
                knot.parse = $knot.HO.bind(craftsman, def.handover);
                break;

            case "BK":
                knot = new __obj_code(craftsman, def.subs);
        }

        return knot;
    }
};

var PatternHelper = {

    compile: function (craftsman, name, defs) {
        __LOGGER.info("PatternHelper {}={}", name, JSON.stringify(defs));
        var p = new Pattern(name);
        p.objCode = new __obj_code(craftsman, defs);

        return p;
    }
};

function Knot()
{
	this.parse = undefined;
	this.logics = [];

	this.execute = function()
    {
        try
        {
            var value = this.parse.call();
            __LOGGER.info("Knot::execute value={}", value);
            for (var i = 0; i < this.logics.length; i++) this.logics[i](value);
        }
        catch(e)
        {
            __LOGGER.error(e.message, e);
        }
    }
}

function Pattern(name)
{
	this.name = name;
	this.objCode = undefined;

	this.parse = function()
    {
        if ( this.objCode !== undefined ) this.objCode.execute();
    }
}

var $craftsman = {
	patterns:{}
	, workshop: undefined
	, yarn: undefined
    , mem: {}
}

function setup(workshop, name, spec)
{
	__LOGGER.info("setup {}={}", name, JSON.stringify(spec));
    __JAVA_TOOL.debugging();

    $craftsman.workshop = workshop;

	for ( var name in spec.patterns )
	{
        $craftsman.patterns[name] = PatternHelper.compile($craftsman, name, spec.patterns[name]);
	}
}

function craft(yarn, options, pattern)
{
    __LOGGER.info("craft yarn={}", yarn);
    $craftsman.yarn = yarn;

    var name = pattern == undefined ? "__main" : pattern;
    var p = $craftsman.patterns[name];
    p.parse();
}

__LOGGER.info("Nashron script workshop loaded !!!");