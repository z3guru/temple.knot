package guru.z3.temple.knot.nashorn;

import jdk.nashorn.api.scripting.ScriptObjectMirror;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.nio.ByteBuffer;

/**
 * Created by jaeda on 2017. 3. 6..
 */
public class JavaTool
{
	private final static Logger scriptLogger = LogManager.getContext().getLogger("script.core");

	public static Logger getLogger()
	{
		return scriptLogger;
	}

	public static void debugging()
	{
		scriptLogger.debug("breaking...");
	}

}
