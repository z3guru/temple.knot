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

var $unknit = {
	BV: function(sz, ref)
	{
        __LOGGER.debug("$unknit:BV sz={}, ref={}", sz, ref);
        var buf = this.yarn.source(sz);
        var value = undefined;

		switch(sz)
		{
			case 1: value = buf.get();      break;
			case 2: value = buf.getShort(); break;
			case 4: value = buf.getInt();   break;
			case 8: value = buf.getLong();  break;
		}

		this.workshop.getReferences().put(ref, value);
        __LOGGER.debug("$unknit:BV:ref name={}, value={}", ref, value);
	}
	, HO: function(to)
    {
        __LOGGER.debug("$unknit:HO to={}", to);
        this.workshop.handover(to);
    }

    , dummy: function(def, name)
    {
        __LOGGER.debug("dummy name={}", name);
    }

    , util: {
	    checkMin: function(min, value) {
            __LOGGER.debug("$unknit:util:checkMin min={}, value={}", min, value);
	        if ( value < min ) throw "Underflow value=" + value + ", with min=" + min;
        }

        , ref: function(mem, name, value) {
            //__LOGGER.debug("$unknit:util:ref name={}, value={}", name, value);
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

var $knit = {
    BV: function(sz, ref)
    {
        __LOGGER.debug("$knit:BV sz={}, ref={}", sz, ref);
        var value = this.refMap.get(ref);

        __LOGGER.debug("value=" + value);
    }
}

function __knot_code(craftsman, defs)
{
    //this.craftsman = craftsman;
    this.defs = defs;
    this.knots = [];

    for (var i = 0; i < defs.length; i++) {
        var knot = KnotHelper.compile(craftsman, defs[i])
        this.knots.push(knot);
    }

    this.knit = function()
    {
        for ( var i = 0; i < this.knots.length; i++ )
        {
            this.knots[i].knit();
        }
    }

    this.unknit = function()
    {
        for ( var i = 0; i < this.knots.length; i++ )
        {
            this.knots[i].unknit();
        }
    }
}

var KnotHelper = {
    compile: function (craftsman, def) {
        var knot = new Knot();

        // 보조 함수들을 확인한다. ===================================
        if ( def.min !== undefined )
        {
            knot.logics.push($unknit.util.checkMin.bind(knot, def.min))
        }

        if ( def.ref !== undefined )
        {
            //knot.logics.push($unknit.util.ref.bind(knot, craftsman.mem, def.ref))
        }

        switch (def.knot) {
            case "BV":
                knot.unknit = $unknit.BV.bind(craftsman, def.size, def.ref);
                knot.knit = $knit.BV.bind(craftsman, def.size, def.ref);
                break;

            case "HO":
                knot.unknit = $unknit.HO.bind(craftsman, def.handover);
                break;

            case "BK":
                knot = new __unknit_code(craftsman, def.subs);
        }

        return knot;
    }
};

var PatternHelper = {

    compile: function (craftsman, name, defs) {
        __LOGGER.info("PatternHelper {}={}", name, JSON.stringify(defs));
        var p = new Pattern(name);
        p.code = new __knot_code(craftsman, defs);

        return p;
    }
};

function Knot()
{
	this.unknit = undefined;
    this.knit = undefined;
	this.logics = [];

	this.execute = function()
    {
        try
        {
            var value = this.unknit.call();
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
	this.code = undefined;

	this.unknit = function()
    {
        if ( this.code !== undefined ) this.code.unknit();
    }

    this.knit = function()
    {
        if ( this.code !== undefined ) this.code.knit();
    }
}

var $craftsman = {
	patterns:{}
	, workshop: undefined
	, yarn: undefined
    , refMap: undefined
    , setWorkshop: function(workshop) {
        this.refMap = workshop.getReferences();
        this.workshop = workshop;
    }
}

function setup(workshop, name, spec)
{
	__LOGGER.info("setup {}={}", name, JSON.stringify(spec));
    __JAVA_TOOL.debugging();

    $craftsman.setWorkshop(workshop);
    $craftsman.workshop = workshop;

	for ( var name in spec.patterns )
	{
        $craftsman.patterns[name] = PatternHelper.compile($craftsman, name, spec.patterns[name]);
	}
}

function doKnit(yarn, options, pattern)
{
    __LOGGER.info("craft yarn={}", yarn);
    $craftsman.yarn = yarn;

    var name = pattern == undefined ? "__main" : pattern;
    var p = $craftsman.patterns[name];
    p.knit();
}

function doUnknit(yarn, options, pattern)
{
    __LOGGER.info("craft yarn={}", yarn);
    $craftsman.yarn = yarn;

    var name = pattern == undefined ? "__main" : pattern;
    var p = $craftsman.patterns[name];
    p.unknit();
}

__LOGGER.info("Nashron script workshop loaded !!!");