package guru.z3.temple.knot.nashorn;

import guru.z3.temple.knot.CraftsMan;
import guru.z3.temple.knot.Fabric;
import guru.z3.temple.knot.Yarn;

import javax.script.Invocable;
import javax.script.ScriptEngine;
import javax.script.ScriptException;
import java.io.IOException;
import java.util.Set;

public class NashornCraftsMan implements CraftsMan
{
	private ScriptEngine engine;

	public NashornCraftsMan(ScriptEngine engine)
	{
		this.engine = engine;
	}

	@Override
	public void knit(Fabric yarn, Set<WorkOption> options) throws IOException
	{
		try
		{
			((Invocable)engine).invokeFunction("doKnit", yarn, options);
		}
		catch (ScriptException e)
		{
			throw new IOException(e.getMessage(), e);
		}
		catch (NoSuchMethodException e)
		{
			throw new IOException(e.getMessage(), e);
		}
	}

	@Override
	public void unknit(Yarn yarn, Set<WorkOption> options) throws IOException
	{
		try
		{
			((Invocable)engine).invokeFunction("doUnknit", yarn, options);
		}
		catch (ScriptException e)
		{
			throw new IOException(e.getMessage(), e);
		}
		catch (NoSuchMethodException e)
		{
			throw new IOException(e.getMessage(), e);
		}
	}
}
