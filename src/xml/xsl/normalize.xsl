<?xml version="1.0" encoding="utf-8"?>
<!-- Normalizes the whitespace in a document. -->
<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output method="xml" indent="yes"/>
    
<xsl:template match='/'>        
  <xsl:apply-templates/>
</xsl:template>

<xsl:template match='*'>
  <xsl:copy>
    <xsl:apply-templates select='*|@*|comment()|text()'/>
  </xsl:copy>
</xsl:template>

<xsl:template match="@*">
	<xsl:copy></xsl:copy>
</xsl:template>

<xsl:template match="text()">
  <xsl:value-of select="normalize-space(.)"/>
</xsl:template>

</xsl:stylesheet>