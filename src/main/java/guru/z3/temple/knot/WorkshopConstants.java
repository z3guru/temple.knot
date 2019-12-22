/*
This work is licensed under the Creative Commons Attribution-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/
package guru.z3.temple.knot;

public class WorkshopConstants
{
	public enum StreamDirection { Out, In, Both };

	/** This is a name of property shall have full name of a class which builds {@link Craftsman} actually */
	public static String CRAFTSMAN_BUILDER_CLASS 		= "knots.craftsman.builder.class";
	/** This is a name of property shall have full name of a class which builds {@link Tool} actually */
	public static String TOOL_BUILDER_CLASS 			= "knots.tool.builder.class";

	/** This is a name of property shall have a information of connecting a device as string */
	public static String DEVICE_CONNECTION_STRING		= "knots.device.connection.string";
	/** This is a name of property shall have a protocol used for data communication */
	public static String DEVICE_CONNECTION_PROTOCOL		= "knots.device.connection.protocol";
	/** The name of property with the IP of a device used for data communication */
	public static String DEVICE_CONNECTION_IP			= "knots.device.connection.ip";
	/** The name of property with the Port(TCP/UDP) of a device used for data communication */
	public static String DEVICE_CONNECTION_PORT			= "knots.device.connection.port";



}
