package guru.z3.temple.knot.nashorn;

import guru.z3.temple.knot.CraftsMan;
import guru.z3.temple.knot.Workshop;
import jdk.nashorn.api.scripting.ScriptObjectMirror;

import javax.script.Invocable;
import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;

public class NashornCraftsManUnion
{
	private final static NashornCraftsManUnion instance = new NashornCraftsManUnion();

	private NashornCraftsManUnion()
	{
	}

	public static NashornCraftsManUnion getInstance()
	{
		return instance;
	}

	public CraftsMan ready(Workshop workshop, String name, String path) throws IOException
	{
		try
		{
			ScriptEngineManager engineManager = new ScriptEngineManager();
			ScriptEngine engine = engineManager.getEngineByName("nashorn");
			//engine.eval("load('classpath:nashorn-script/workshop.js')");
			engine.eval("load('src/main/resources/nashorn-script/workshop.js')");

			ScriptObjectMirror json = (ScriptObjectMirror)engine.eval("JSON");
			ScriptObjectMirror spec = (ScriptObjectMirror)json.callMember("parse", loadSpec(path));

			((Invocable)engine).invokeFunction("setup", workshop, name, spec);
			CraftsMan cm = new NashornCraftsMan(engine);
			workshop.putCraftsMan(name, cm);

			return cm;
		}
//		catch(IOException e)
//		{
//			throw e;
//		}
		catch(Exception e)
		{
			throw new IOException(e.getMessage(), e);
		}
	}

	private String loadSpec(String path) throws IOException
	{
		try(BufferedReader reader = new BufferedReader(new FileReader(path)))
		{
			String line = null;
			StringBuilder sb = new StringBuilder();

			while((line = reader.readLine()) != null ) sb.append(line).append("\n");

			return sb.toString();
		}
	}

}
