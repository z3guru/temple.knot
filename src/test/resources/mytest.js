/**
 *
 */

var spec = {
	info: {
		name: 'HSMS specification'
	}
	, knots: {
		"MAIN": [
			LEN(4)
			, LBLOCK([
				V(2, "ssid")
                , V(1, "hb2")
                , V(1, "hb3")
                , V(1, "ptype")
                , V(1, "stype")
                , V(4, "sb")
				, STREAM(0, "msg")
			])
		]
	}
	, template: {
		  "select.req": ["MAIN", {"hb2":0, "hb3":0, "ptype":0, "stype":1}]
		, "select.rsp": ["MAIN", {"hb2":0, "hb3":0, "ptype":0, "stype":2}]
	}
	, flow: {
		"onconnect": {
			"FLOW.IF": {
				  "condition":"WORKSHOP.mode == WORKSHOP.ACTIVE"
				, "then": [
					{"FLOW.SEND": ["select.req", {ssid:settings["ssid"], "sb":nextsb()}]}
					]
				, "else": [
					{"FLOW.WAIT": [FLOW.TIMEOUT("T8"), function(msg) {}]}
            }
		}
	}

}

