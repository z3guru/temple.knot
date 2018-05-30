package unittest.knot.nashorn;

import guru.z3.temple.knot.CraftsMan;
import guru.z3.temple.knot.Workshop;
import guru.z3.temple.knot.Yarn;
import guru.z3.temple.knot.nashorn.NashornCraftsMan;
import guru.z3.temple.knot.nashorn.NashornCraftsManUnion;
import jdk.nashorn.api.scripting.ScriptObjectMirror;
import org.junit.Test;

import javax.script.Invocable;
import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import java.io.IOException;
import java.util.Arrays;
import java.util.stream.Collectors;

public class TestNashornCraftsMan
{
	@Test
	public void testCraft() throws Exception
	{
		Workshop workshop = new Workshop();
		CraftsMan hsms = NashornCraftsManUnion.getInstance().ready(workshop, "HSMS", "/Users/jaeda/workspace/git/temple.knot/src/test/resources/hsms.json");
		CraftsMan secs2 = NashornCraftsManUnion.getInstance().ready(workshop, "SECS2", "/Users/jaeda/workspace/git/temple.knot/src/test/resources/secs2.json");
		//workshop.putCraftsMan("HSMS", hsms);
		//workshop.putCraftsMan("SECS2", secs2);

		Yarn yarn = new MockHsmsYarn();
		hsms.craft(yarn, Arrays.stream(new CraftsMan.WorkOption[]{}).collect(Collectors.toSet()));

		try { Thread.sleep(60000); } catch (InterruptedException e) { }
	}

	@Test
	public void testExpression() throws Exception
	{
		try
		{
			ScriptEngineManager engineManager = new ScriptEngineManager();
			ScriptEngine engine = engineManager.getEngineByName("nashorn");
			engine.eval("load('src/main/resources/nashorn-script/workshop.js')");
			engine.eval("load('src/test/resources/workshop-test.js')");
			((Invocable)engine).invokeFunction("testExpression");
		}
		catch(Exception e)
		{
			throw e;
		}

	}
}
