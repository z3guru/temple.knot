/**
 *
 */

var Secs2Store = Java.type("unittest.knot.nashorn.Secs2Store");

var untie_spec = {
	info: {
		name: 'test specification'
	}
	, artifact: {
    	  starter: "main"
        , sequence: {
    		"main": [ "TYPE", "LENGTH", "DATA-BR" ]  // compile이 될 수 있게..
	    }
	    , configurations: {

	    }
        , knots: {
            "TYPE": {
            	inbuf: 1
                , operable: function() { return JOOL.TT.CTX.pack() && JOOL.TT.CTX.size(1); }
                , handlers:[
		              { name:"assign", args:["type", function() { return (JOOL.mem.packBuf[0] & 0xFC) >> 2 }] }    // 데이터 접근을 예약어로만..
                    , { name:"assign", args:["lob", function() { return JOOL.mem.packBuf[0] & 0x3 }] }
				]
            }
		    , "LENGTH": {
            	inbuf: $V('lob')
			    , operable: function() { return JOOL.TT.CTX.pack() && JOOL.TT.CTX.size($V('lob')); }  //"pack() && size($V('lob'))"
			    , handlers:[
				    { name:"assign", args:["length", __HELPERS['BIGENDIAN_INT']] }
			    ]
		    }
		    , "DATA": {
			      operable: "pack() && size($V('length'))"
			    , handlers:[
				      { name:"assign2", args:["value", function() { return __HELPERS[JOOL.api.__USERLIB('PARSE_FUNC', $V('type'))] } ] }
				    , { name:"output", args:["MYSTORE", "save($V('type'), $V('type'), $V('value')"] }
			    ]
		    }
        }
        , branches: {
        	"DATA-BR": [
		          { condition:"$V('type') == 0", work: function() { for ( var i = 0; i < $V('length'); i++ ) JOOL.api.__SEQ('main'); } }
		        , { work: function() { JOOL.api.__KNOT('DATA') } }
	        ]
	    }
        , userLIB: {
			"SECSII-TYPE": function(t) {
				var sz = 1;
				switch(t)
				{
					case 010: sz = 1; break;
					case 040: sz = 8; break;
				}

				return sz;
			}
			, "PARSE_FUNC": function(t) {
				var func = 'BIGENDIAN_INT';

				switch(t)
				{
					case 020: func = 'ASCII'; break;
					case 040: func = 'DOUBLE'; break;
				}

				return func;
		    }
		}
		, output: {
			"MYSTORE": new Secs2Store()
	    }
    }
	/*
    , tie: {
		knots: {
			"ITEM_BRANCH": TIE.api.__BRANCH(
				__condition({condition:"$NEXT.type == 0", work:function(){ JOOL.api.__KNOT('TYPE-LENGTH'); }})
				, __condition({work: function() { JOOL.api.__KNOT('DATA') }})
			)

			// 각각의 기능을 하는 하위 단위 함수들을 가지고 점점 더 큰 단위의 함수들이 그려지는 모습으로 가자
			// 함수에서는 몇가지 예약함수들을 둬서 변수에 적용할 수 있도록 한다 
			, "LIST": TIE.api.__SEQ(
				__assign("lob", function() { })
				, TIE.api.__PACK(
					__bit("type", 6)
					, __bit("lob", 2)
				)
				, TIE.api.__PACK("length", "$V('lob')")
				, TIE.api.__BRANCH("DATA-BR")
			)
			, "ITEM": [
				function() { }
				, TIE.api.__PACK("length", "$V('lob')")
				, TIE.api.__PACK("data", "$V('lob')")
			]
		}
		, branches: {
			"DATA-BR": [
				{ condition:"$NEXT.type == 0", work: function() { JOOL.api.__KNOT('TYPE-LENGTH'); } }
				, { work: function() { JOOL.api.__KNOT('DATA') } }
			]
		}
	}
	*/
}

setup('untie.specification', untie_spec);

// specific run context
