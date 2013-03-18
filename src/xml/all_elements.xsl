<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:rng="http://relaxng.org/ns/structure/1.0"
	exclude-result-prefixes=""
	>

<xsl:template match="/">
[<xsl:apply-templates/>]
</xsl:template>

<xsl:template match="//rng:element">'<xsl:value-of select="@name"/>', </xsl:template>

<xsl:template match="text()"></xsl:template>

</xsl:stylesheet>