/**
 * Created by jaeda on 2017. 2. 17..
 */


function testExpression()
{
	var regex = /(&\w+)/g;
	var str = "&len + 1 - &crc";
    var m = regex.exec(str);

	while( m != null )
	{
        __LOGGER.debug("matches[]={}", regex.lastIndex);
        //regex.lastIndex = 0;
        m = regex.exec(str);
    }

    __LOGGER.debug("Hello test matches.length={}", matches.length);
}
