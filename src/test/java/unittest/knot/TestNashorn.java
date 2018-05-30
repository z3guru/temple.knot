package unittest.knot;

import jdk.nashorn.api.scripting.NashornScriptEngine;
import jdk.nashorn.api.scripting.ScriptObjectMirror;
import org.junit.Test;

import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;

public class TestNashorn
{
	@Test
	public void testJSON() throws Exception
	{
		ScriptEngineManager engineManager = new ScriptEngineManager();
		ScriptEngine engine = engineManager.getEngineByName("nashorn");

		// parse JSON
		ScriptObjectMirror json = (ScriptObjectMirror)engine.eval("JSON");

		String data = "{\"name\":\"ZCUBE\"}";
		ScriptObjectMirror parsed = (ScriptObjectMirror)json.callMember("parse", data);

		// binding
		engine.put("spec", parsed);

		// run test code
		String script = "print('Hello ' + spec.name)";
		engine.eval(script);
	}

}
